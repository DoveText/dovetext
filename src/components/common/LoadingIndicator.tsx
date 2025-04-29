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

    // Function to handle route change start
    const handleStart = (newUrl: string) => {
      // Only show loading indicator if we're navigating to a different page
      if (newUrl !== url.toString()) {
        setLoading(true);
      }
    };

    // Function to handle route change complete
    const handleComplete = () => {
      setLoading(false);
    };

    // Listen for route change events
    window.addEventListener('beforeunload', () => handleStart(''));
    
    // Custom event listeners for Next.js router events
    document.addEventListener('routeChangeStart', () => {
      handleStart('');
    });
    
    document.addEventListener('routeChangeComplete', () => {
      handleComplete();
    });
    
    // Create a MutationObserver to detect when the URL changes
    const observer = new MutationObserver((mutations) => {
      const currentUrl = window.location.href;
      if (currentUrl !== url.toString()) {
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
        setLoading(false);
      }, 3000); // 3 seconds max loading time
    };
    
    // When loading state changes, reset the safety timeout
    if (loading) {
      resetSafetyTimeout();
    }

    return () => {
      window.removeEventListener('beforeunload', () => handleStart(''));
      document.removeEventListener('routeChangeStart', () => handleStart(''));
      document.removeEventListener('routeChangeComplete', handleComplete);
      observer.disconnect();
      clearTimeout(safetyTimeout);
    };
  }, [pathname, searchParams, loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-blue-600 animate-pulse">
        <div className="h-full bg-blue-500 animate-progress"></div>
      </div>
    </div>
  );
}
