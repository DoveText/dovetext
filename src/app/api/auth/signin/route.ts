import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { config } from '@/lib/db/config';

export async function POST(request: Request) {
  try {
    const { email, firebaseUid } = await request.json();

    const pool = new Pool(config);
    
    try {
      // Update user's last_login_at in our database
      const result = await pool.query(
        `UPDATE users 
         SET last_login_at = NOW() 
         WHERE email = $1 AND firebase_uid = $2
         RETURNING id, email, display_name, avatar_url, settings`,
        [email, firebaseUid]
      );

      if (result.rows.length === 0) {
        // User exists in Firebase but not in our DB
        // This could happen if the user was created in Firebase but our DB insert failed
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
