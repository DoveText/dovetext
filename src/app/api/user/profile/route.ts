import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withAuth, type NextRequestWithAuth } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: NextRequestWithAuth) => {
  try {
    const user = await db.oneOrNone(
      `SELECT 
        id,
        email,
        display_name,
        avatar_url,
        firebase_uid,
        created_at,
        last_login_at,
        settings,
        email_verified
       FROM users 
       WHERE firebase_uid = $1`,
      [request.session!.uid]
    );

    if (!user) {
      return NextResponse.json({
        email: request.session!.email,
        firebaseUid: request.session!.uid,
        emailVerified: request.session!.emailVerified,
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      firebaseUid: user.firebase_uid,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      settings: user.settings,
      emailVerified: user.email_verified
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
