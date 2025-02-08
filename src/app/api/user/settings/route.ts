import { NextResponse } from 'next/server';
import { db } from '@/db';
import type { AuthenticatedSession } from '@/types/session';

// Type guard for authenticated session
function isAuthenticated(session: Request['session']): session is AuthenticatedSession {
  return session.signedIn;
}

// Get user settings
export async function GET(request: Request) {
  if (!isAuthenticated(request.session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.oneOrNone(
    'SELECT settings FROM users WHERE firebase_uid = $1',
    [request.session.uid]
  );

  return NextResponse.json(settings?.settings || {});
}

// Update user settings
export async function PUT(request: Request) {
  if (!isAuthenticated(request.session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const result = await db.one(
      `UPDATE users 
       SET settings = $1 
       WHERE firebase_uid = $2 
       RETURNING settings`,
      [body, request.session.uid]
    );

    return NextResponse.json(result.settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
