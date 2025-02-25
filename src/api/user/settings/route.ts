import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { withAuth, type NextRequestWithAuth } from '@/api/withAuth';

// Get user settings
export const GET = withAuth(async (request: NextRequestWithAuth) => {
  try {
    const settings = await db.oneOrNone(
      'SELECT settings FROM users WHERE firebase_uid = $1',
      [request.session!.uid]
    );

    return NextResponse.json(settings?.settings || {});
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Update user settings
export const PUT = withAuth(async (request: NextRequestWithAuth) => {
  try {
    const body = await request.json();
    
    const result = await db.one(
      `UPDATE users 
       SET settings = $1 
       WHERE firebase_uid = $2 
       RETURNING settings`,
      [body, request.session!.uid]
    );

    return NextResponse.json(result.settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
});
