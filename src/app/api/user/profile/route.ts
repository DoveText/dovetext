import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth/verifyToken';

export async function GET(request: Request) {
  try {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json({}, { status: 401 });
    }

    // Get user info from our database
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
      [decodedToken.uid]
    );

    if (!user) {
      return NextResponse.json({
        // Return Firebase user info if not in our DB
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        emailVerified: decodedToken.email_verified,
      });
    }

    // Return combined info
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
}
