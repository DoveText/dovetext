import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { checkActionCode } from 'firebase/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  if (!mode || !oobCode) {
    return redirect('/');
  }

  // Handle different authentication modes
  switch (mode) {
    case 'resetPassword':
      try {
        // Get the email address from the action code info
        const info = await checkActionCode(auth, oobCode);
        const email = info.data.email;
        
        if (!email) {
          console.error('No email found in action code info');
          return redirect('/reset-password?error=invalid_code');
        }
        
        return redirect(`/reset-password?mode=${mode}&oobCode=${oobCode}&email=${encodeURIComponent(email)}`);
      } catch (error) {
        console.error('Error checking action code:', error);
        return redirect('/reset-password?error=invalid_code');
      }
    case 'verifyEmail':
      return redirect(`/verify-email?mode=${mode}&oobCode=${oobCode}`);
    case 'recoverEmail':
      return redirect(`/recover-email?mode=${mode}&oobCode=${oobCode}`);
    default:
      return redirect('/');
  }
}
