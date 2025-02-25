import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function POST(request: Request) {
  try {
    const { email, firebaseUid } = await request.json();

    // Update user's last_login_at in our database
    const result = await db.oneOrNone(
      `UPDATE users 
       SET last_login_at = NOW() 
       WHERE email = $1 AND firebase_uid = $2
       RETURNING id, email, display_name, avatar_url, settings`,
      [email, firebaseUid]
    );

    if (!result) {
      // User exists in Firebase but not in our DB
      // This could happen if the user was created in Firebase but our DB insert failed
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
