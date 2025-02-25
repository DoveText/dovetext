import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase token
    const decodedToken = await getAuth().verifyIdToken(token);
    if (!decodedToken.uid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get the invitation code from request body
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Check if the invitation code is valid and can be used
    const inviteResult = await db.oneOrNone(`
      SELECT * FROM invitation_codes 
      WHERE code = $1 
      AND is_active = true 
      AND (max_uses = 0 OR used_count < max_uses)
    `, [code]);

    if (!inviteResult) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 400 }
      );
    }

    // Mark the code as used and activate the user
    const result = await db.tx(async t => {
      // Get user id and email
      const user = await t.one(`
        SELECT id, email FROM users WHERE firebase_uid = $1
      `, [decodedToken.uid]);

      // Record the code use
      await t.none(`
        INSERT INTO invitation_code_uses (code, user_id, user_email)
        VALUES ($1, $2, $3)
      `, [code, user.id, user.email]);

      // Increment the used count
      await t.none(`
        UPDATE invitation_codes 
        SET used_count = used_count + 1
        WHERE code = $1
      `, [code]);

      // Activate user and return updated data
      return await t.one(`
        UPDATE users 
        SET is_active = true
        WHERE firebase_uid = $1
        RETURNING id, email, settings, is_active
      `, [decodedToken.uid]);
    });

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully',
      user: result
    });

  } catch (error) {
    console.error('Error activating account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
