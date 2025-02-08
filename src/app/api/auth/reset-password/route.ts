import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const { firebaseUid, newPassword } = await request.json();

    if (!firebaseUid || !newPassword) {
      return NextResponse.json(
        { error: 'Firebase UID and new password are required' },
        { status: 400 }
      );
    }

    const encryptedPassword = await hashPassword(newPassword);

    const result = await db.oneOrNone(
      `UPDATE users 
       SET encrypted_password = $1
       WHERE firebase_uid = $2
       RETURNING id`,
      [encryptedPassword, firebaseUid]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error resetting password:', error.message);
    }
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
