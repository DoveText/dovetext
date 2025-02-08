import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firebaseUid, invitationCode } = body;
    
    console.log('Signup request received:', { email, firebaseUid, invitationCode, hasPassword: !!password });

    // Start a transaction
    return await db.tx(async t => {
      // Check if email exists
      console.log('Checking if email exists:', email);
      const existingUser = await t.oneOrNone(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser) {
        console.log('Email already exists:', email);
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // Check invitation code
      console.log('Checking invitation code:', invitationCode);
      const invitation = await t.oneOrNone(`
        SELECT 
          ic.*,
          COUNT(icu.id) as current_uses
        FROM invitation_codes ic
        LEFT JOIN invitation_code_uses icu ON ic.code = icu.code
        WHERE ic.code = $1
        GROUP BY ic.code
      `, [invitationCode]);

      console.log('Invitation code result:', invitation);

      if (!invitation || !invitation.is_active || invitation.current_uses >= invitation.max_uses) {
        console.log('Invalid invitation code:', { 
          exists: !!invitation, 
          isActive: invitation?.is_active, 
          currentUses: invitation?.current_uses, 
          maxUses: invitation?.max_uses 
        });
        return NextResponse.json(
          { error: 'Invalid or expired invitation code' },
          { status: 400 }
        );
      }

      // For Google sign-in, we don't need to store a password
      const encryptedPassword = password ? await hashPassword(password) : null;
      console.log('Creating user with', { email, firebaseUid, hasPassword: !!encryptedPassword });

      // Create user with encrypted password (null for Google sign-in)
      const user = await t.one(`
        INSERT INTO users (email, firebase_uid, encrypted_password, settings)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, display_name, avatar_url, settings
      `, [email, firebaseUid, encryptedPassword, {}]);

      console.log('User created:', user);

      // Record invitation code use
      console.log('Recording invitation code use');
      await t.none(`
        INSERT INTO invitation_code_uses (code, user_id, user_email)
        VALUES ($1, $2, $3)
      `, [invitationCode, user.id, email]);

      console.log('Signup completed successfully');
      return NextResponse.json(user);
    });
  } catch (error) {
    console.error('Signup error:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
