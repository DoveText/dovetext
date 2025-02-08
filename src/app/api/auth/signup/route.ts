import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function POST(request: Request) {
  try {
    const { email, firebaseUid, invitationCode } = await request.json();

    // Start a transaction
    return await db.tx(async t => {
      // Check if email exists
      const existingUser = await t.oneOrNone(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // Check invitation code
      const invitation = await t.oneOrNone(`
        SELECT 
          ic.*,
          COUNT(icu.id) as current_uses
        FROM invitation_codes ic
        LEFT JOIN invitation_code_uses icu ON ic.code = icu.code
        WHERE ic.code = $1
        GROUP BY ic.code
      `, [invitationCode]);

      if (!invitation || !invitation.is_active || invitation.current_uses >= invitation.max_uses) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation code' },
          { status: 400 }
        );
      }

      // Create user
      const user = await t.one(`
        INSERT INTO users (email, firebase_uid, settings)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [email, firebaseUid, {}]);

      // Record invitation code use
      await t.none(`
        INSERT INTO invitation_code_uses (code, user_id, user_email)
        VALUES ($1, $2, $3)
      `, [invitationCode, user.id, email]);

      return NextResponse.json({
        success: true,
        userId: user.id
      });
    });
  } catch (error) {
    console.error('Error in signup:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup' },
      { status: 500 }
    );
  }
}
