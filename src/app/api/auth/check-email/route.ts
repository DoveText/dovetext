import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const result = await db.oneOrNone(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return NextResponse.json({
      exists: !!result,
      available: !result
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
