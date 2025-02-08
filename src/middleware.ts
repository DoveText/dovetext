import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './lib/firebase/admin';
import type { UserSession, AuthenticatedSession } from './types/session';

// Define public routes that don't need authentication
const publicPaths = [
  '/api/version/check',
  '/api/health',
  // Add other public paths here
];

// Helper to create a new request with session
function createRequestWithSession(request: Request, session: UserSession): Request {
  const newRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  });

  // Add session to the request object
  Object.defineProperty(newRequest, 'session', {
    value: session,
    enumerable: true,
  });

  return newRequest;
}

export async function middleware(request: NextRequest) {
  // For public routes, add anonymous session and continue
  const path = request.nextUrl.pathname;
  if (publicPaths.some(p => path.startsWith(p))) {
    const anonymousSession = { signedIn: false };
    return NextResponse.next({
      request: createRequestWithSession(request, anonymousSession),
    });
  }

  // For protected routes, verify the token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Create authenticated session
    const session: AuthenticatedSession = {
      signedIn: true,
      uid: decodedToken.uid,
      email: decodedToken.email!,
      emailVerified: decodedToken.email_verified!,
      displayName: decodedToken.name,
    };

    // Return response with the session-enhanced request
    return NextResponse.next({
      request: createRequestWithSession(request, session),
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',  // Only run on API routes
};
