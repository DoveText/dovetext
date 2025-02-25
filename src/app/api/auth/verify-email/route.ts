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
    if (!decodedToken.uid || !decodedToken.email_verified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 400 }
      );
    }

    // Update user settings to mark email as validated
    const result = await db.one(`
      UPDATE users 
      SET settings = settings || 
        jsonb_build_object('validated', true)
      WHERE firebase_uid = $1
      RETURNING settings
    `, [decodedToken.uid]);

    return NextResponse.json({
      success: true,
      settings: result.settings
    });

  } catch (error) {
    console.error('Error updating email validation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
