import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { hashPassword } from '@/app/api/password';
import { validateEmailFormat } from '@/lib/validation/email';

interface UserSettings {
  provider: 'email' | 'google' | 'github';
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firebaseUid, provider } = body;
    
    if (!provider || !['email', 'google', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid authentication provider' },
        { status: 400 }
      );
    }

    // Validate email format if provider is email
    if (provider === 'email') {
      const emailValidation = validateEmailFormat(email);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 }
        );
      }
    }

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

      // For Google sign-in, we don't need to store a password
      const encryptedPassword = password ? await hashPassword(password) : null;
      
      // Use the provided provider in settings
      const settings: UserSettings = {
        provider,
      };

      // Create user with encrypted password (null for Google sign-in)
      // Set is_active to false by default
      const user = await t.one(`
        INSERT INTO users (
          email, 
          firebase_uid, 
          encrypted_password, 
          settings,
          is_active
        )
        VALUES ($1, $2, $3, $4, false)
        RETURNING id, email, display_name, avatar_url, settings
      `, [email, firebaseUid, encryptedPassword, settings]);

      return NextResponse.json(user);
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
