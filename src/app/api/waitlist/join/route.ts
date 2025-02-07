import { NextResponse } from 'next/server';
import { WaitlistQueries } from '../../../../db/waitlist';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, useCases, customUseCase } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!useCases || !Array.isArray(useCases)) {
      return NextResponse.json(
        { error: 'Use cases must be an array' },
        { status: 400 }
      );
    }

    // Check if email exists first
    const { exists } = await WaitlistQueries.checkEmail(email);

    // Add new entry with appropriate status
    const entry = await WaitlistQueries.addEntry({
      email,
      status: exists ? 'update' : 'join',
      use_cases: useCases,
      custom_case: customUseCase
    });

    return NextResponse.json({
      updated: exists,
      entry
    });
  } catch (error) {
    console.error('Error processing waitlist entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
