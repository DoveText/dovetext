import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase/admin';
import type { AuthenticatedSession } from '@/types/session';

export type NextRequestWithAuth = NextRequest & {
  session?: AuthenticatedSession;
};

export function withAuth(handler: (request: NextRequestWithAuth) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      // Skip auth for public paths
      const publicPaths = ['/api/version/check', '/api/health'];
      if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
        return handler(request as NextRequestWithAuth);
      }

      // Check for auth header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify token
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

      // Add session to request
      (request as NextRequestWithAuth).session = session;

      // Call the handler with the authenticated request
      return handler(request as NextRequestWithAuth);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}
