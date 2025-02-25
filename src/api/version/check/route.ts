import { NextResponse } from 'next/server';

// You might want to get this from your package.json or environment variables
const MINIMUM_VERSION = '1.0.0';
const LATEST_VERSION = '1.0.0';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    if (!version) {
      return NextResponse.json(
        { error: 'Version parameter is required' },
        { status: 400 }
      );
    }

    // Compare versions (you might want to use a proper version comparison library)
    const needsUpdate = version !== LATEST_VERSION;
    const isSupported = version >= MINIMUM_VERSION;

    return NextResponse.json({
      currentVersion: version,
      latestVersion: LATEST_VERSION,
      needsUpdate,
      isSupported,
      updateUrl: needsUpdate ? 'https://dove.app/download' : null,
      // Include auth status in response
      authenticated: request.session.signedIn
    });
  } catch (error) {
    console.error('Error checking version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}