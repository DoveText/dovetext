'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import TaskOrientedChat from '@/components/common/TaskOrientedChat';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsValidation, isActive } = useAuth();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add a timeout to handle cases where auth state might be stuck
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000); // 3 second timeout
    }
    return () => {
      clearTimeout(timer);
    };
  }, [loading]);

  // Get current path to prevent redirection loops and for context type
  const pathname = usePathname();
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (!loading || loadingTimeout) {
      if (!user) {
        // Only redirect if not already on the signin page
        if (pathname !== '/' && pathname !== '/signin') {
          // Store the current path for redirection after login
          if (typeof window !== 'undefined' && pathname) {
            localStorage.setItem('auth_redirect_url', pathname);
          }
          router.push('/signin');
        }
      } else {
        // Check if there's a stored redirect URL when user is authenticated
        if (typeof window !== 'undefined' && !needsValidation && isActive) {
          const redirectUrl = localStorage.getItem('auth_redirect_url');
          if (redirectUrl) {
            localStorage.removeItem('auth_redirect_url');
            router.push(redirectUrl);
            return;
          }
        }
        
        if (needsValidation) {
          // Only redirect if not already on the validation page
          if (pathname !== '/auth/validate-email') {
            router.push('/auth/validate-email');
          }
        } else if (!isActive) {
          // Only redirect if not already on the activation page
          if (pathname !== '/auth/activate') {
            router.push('/auth/activate');
          }
        }
      }
    }
  }, [user, loading, needsValidation, isActive, router, loadingTimeout, pathname]);

  // Show loading state
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If we've timed out or auth has failed, show a helpful message
  if (loadingTimeout && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Authentication Issue</h2>
          <p className="mb-4">We're having trouble verifying your login status. This could be due to:</p>
          <ul className="list-disc text-left pl-6 mb-4">
            <li>Your session has expired</li>
            <li>Network connectivity issues</li>
            <li>Server is temporarily unavailable</li>
          </ul>
          <button 
            onClick={() => router.push('/signin')} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Don't render children if user isn't properly authenticated
  if (!user || needsValidation || !isActive) {
    return null;
  }

  // Determine contextType for chat component based on pathname
  const contextType = pathname?.includes('/schedule') ? 'schedule' : pathname?.includes('/tasks') ? 'automation' : 'general';

  return (
    <>
      {children}
      <TaskOrientedChat contextType={contextType} />
    </>  
  );
}
