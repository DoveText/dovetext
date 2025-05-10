'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function LoadingIndicator() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Track the current URL to detect changes
    let currentUrl = window.location.href;

    // Function to handle route change start
    const handleStart = () => {
      setLoading(true);
    };

    // Function to handle route change complete
    const handleComplete = () => {
      setLoading(false);
    };

    // Function to handle clicks on anchor tags
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.target && 
          !anchor.hasAttribute('download') &&
          !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        // It's an internal navigation link
        handleStart();
      }
    };

    // Create a MutationObserver to detect DOM changes that might indicate navigation
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        handleComplete();
      }
    });
    
    // Listen for navigation events
    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', handleStart);
    
    // Custom event listeners for our app's navigation
    document.addEventListener('routeChangeStart', handleStart);
    document.addEventListener('routeChangeComplete', handleComplete);
    
    // Start observing the document with the configured parameters
    observer.observe(document, { subtree: true, childList: true });

    // Add a safety timeout to ensure loading indicator doesn't get stuck
    let safetyTimeout: NodeJS.Timeout;
    
    const resetSafetyTimeout = () => {
      clearTimeout(safetyTimeout);
      safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 seconds max loading time
    };
    
    // When loading state changes, reset the safety timeout
    if (loading) {
      resetSafetyTimeout();
    }

    // Initial page load should trigger loading indicator
    if (document.readyState !== 'complete') {
      handleStart();
      window.addEventListener('load', handleComplete);
    }

    return () => {
      window.removeEventListener('popstate', handleStart);
      window.removeEventListener('load', handleComplete);
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('routeChangeStart', handleStart);
      document.removeEventListener('routeChangeComplete', handleComplete);
      observer.disconnect();
      clearTimeout(safetyTimeout);
    };
  }, [pathname, searchParams, loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-blue-600">
        <div className="h-full bg-blue-500 w-full animate-loading-bar"></div>
      </div>
    </div>
  );
}
