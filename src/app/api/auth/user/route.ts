import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: Request) {
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user data from database
    const user = await db.oneOrNone(`
      SELECT 
        id,
        email,
        firebase_uid,
        settings,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE firebase_uid = $1
    `, [decodedToken.uid]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
