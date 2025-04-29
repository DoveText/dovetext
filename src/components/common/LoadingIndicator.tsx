'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingIndicator() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Create a new URL object
    const url = new URL(pathname || '/', window.location.origin);
    
    // Add search params if any
    searchParams?.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    console.log('[LoadingIndicator] Initialized with URL:', url.toString());
    console.log('[LoadingIndicator] Current pathname:', pathname);

    // Function to handle route change start
    const handleStart = (newUrl: string) => {
      // Only show loading indicator if we're navigating to a different page
      if (newUrl !== url.toString()) {
        console.log('[LoadingIndicator] Navigation started to:', newUrl || 'unknown URL');
        setLoading(true);
      } else {
        console.log('[LoadingIndicator] Navigation started but URL is the same, not showing indicator');
      }
    };

    // Function to handle route change complete
    const handleComplete = () => {
      console.log('[LoadingIndicator] Navigation completed, hiding indicator');
      setLoading(false);
    };

    // Listen for route change events
    window.addEventListener('beforeunload', () => handleStart(''));
    
    // Custom event listeners for Next.js router events
    document.addEventListener('routeChangeStart', () => {
      console.log('[LoadingIndicator] routeChangeStart event received');
      handleStart('');
    });
    
    document.addEventListener('routeChangeComplete', () => {
      console.log('[LoadingIndicator] routeChangeComplete event received');
      handleComplete();
    });
    
    // Create a MutationObserver to detect when the URL changes
    const observer = new MutationObserver((mutations) => {
      const currentUrl = window.location.href;
      if (currentUrl !== url.toString()) {
        console.log('[LoadingIndicator] URL changed via MutationObserver:', currentUrl);
        handleComplete();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document, { subtree: true, childList: true });

    // Add a safety timeout to ensure loading indicator doesn't get stuck
    let safetyTimeout: NodeJS.Timeout;
    
    const resetSafetyTimeout = () => {
      clearTimeout(safetyTimeout);
      safetyTimeout = setTimeout(() => {
        console.log('[LoadingIndicator] Safety timeout triggered, forcing indicator to hide');
        setLoading(false);
      }, 3000); // 3 seconds max loading time
    };
    
    // When loading state changes, reset the safety timeout
    if (loading) {
      console.log('[LoadingIndicator] Loading state is true, setting safety timeout');
      resetSafetyTimeout();
    }

    return () => {
      window.removeEventListener('beforeunload', () => handleStart(''));
      document.removeEventListener('routeChangeStart', () => handleStart(''));
      document.removeEventListener('routeChangeComplete', handleComplete);
      observer.disconnect();
      clearTimeout(safetyTimeout);
      console.log('[LoadingIndicator] Cleanup completed');
    };
  }, [pathname, searchParams, loading]);

  useEffect(() => {
    console.log('[LoadingIndicator] Loading state changed to:', loading);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-blue-600 animate-pulse">
        <div className="h-full bg-blue-500 animate-progress"></div>
      </div>
    </div>
  );
}
