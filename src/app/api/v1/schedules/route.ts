import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { Schedule, CreateScheduleRequest } from '@/types/schedule';
import { scheduleStore } from '@/lib/mockData/scheduleData';

// MOCK IMPLEMENTATION
// In a real backend, this would be replaced with actual API calls to your backend service
// When you're ready to connect to a real backend, you would replace the scheduleStore
// with actual API calls, but keep the same API contract

// API handlers for /api/v1/schedules endpoints

/**
 * GET /api/v1/schedules
 * Get all schedules or filter by date range
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get schedules from the mock store
    // In a real implementation, this would call your backend API
    let userSchedules;
    
    if (startDate && endDate) {
      userSchedules = scheduleStore.getByDateRangeAndUserId(
        new Date(startDate),
        new Date(endDate),
        userId
      );
    } else {
      userSchedules = scheduleStore.getByUserId(userId);
    }

    return NextResponse.json(userSchedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/schedules
 * Create a new schedule
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body: CreateScheduleRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.start || !body.end || body.type === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new schedule
    const newSchedule: Schedule = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...body,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock store
    // In a real implementation, this would call your backend API
    scheduleStore.create(newSchedule);

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
