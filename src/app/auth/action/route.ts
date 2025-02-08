import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  if (!mode || !oobCode) {
    return redirect('/');
  }

  switch (mode) {
    case 'resetPassword':
      return redirect(`/reset-password?mode=${mode}&oobCode=${oobCode}`);
    case 'verifyEmail':
      return redirect(`/verify-email?mode=${mode}&oobCode=${oobCode}`);
    case 'recoverEmail':
      return redirect(`/recover-email?mode=${mode}&oobCode=${oobCode}`);
    default:
      return redirect('/');
  }
}
