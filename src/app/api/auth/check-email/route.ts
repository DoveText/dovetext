import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await db.oneOrNone(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return NextResponse.json({
      exists: !!result,
      available: !result
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error checking email:', error.message);
    }
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await db.oneOrNone(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return NextResponse.json({
      exists: !!result,
      available: !result
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error checking email:', error.message);
    }
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
