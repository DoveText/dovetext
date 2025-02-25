import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { hashPassword } from '@/api/password';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    const encryptedPassword = await hashPassword(newPassword);

    const result = await db.oneOrNone(
      `UPDATE users 
       SET encrypted_password = $1
       WHERE email = $2
       RETURNING id`,
      [encryptedPassword, email]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
