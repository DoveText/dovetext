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

    // Update the validation sent timestamp
    const result = await db.one(`
      UPDATE users 
      SET settings = settings || 
        jsonb_build_object('validationSentAt', to_jsonb(NOW()))
      WHERE firebase_uid = $1
      RETURNING settings
    `, [decodedToken.uid]);

    return NextResponse.json({
      success: true,
      settings: result.settings
    });

  } catch (error) {
    console.error('Error updating validation sent timestamp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
