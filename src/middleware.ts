import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /notifications/rules to /notifications/delivery-rules
  if (pathname === '/notifications/rules') {
    return NextResponse.redirect(new URL('/notifications/delivery-rules', request.url));
  }

  // Rewrite /notifications/chains to /notifications/escalation-chains
  if (pathname === '/notifications/chains') {
    return NextResponse.redirect(new URL('/notifications/escalation-chains', request.url));
  }

  // Rewrite /notifications/methods to /notifications/delivery-methods
  if (pathname === '/notifications/methods') {
    return NextResponse.redirect(new URL('/notifications/delivery-methods', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/notifications/rules',
    '/notifications/chains',
    '/notifications/methods',
  ],
};
