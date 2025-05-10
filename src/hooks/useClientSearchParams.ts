'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side only hook that provides URL search parameters functionality
 * without relying on Next.js's useSearchParams hook
 * 
 * This avoids the need for Suspense boundaries in static exports
 */
export function useClientSearchParams() {
  // Initialize with empty values for SSR/static generation
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // This effect will only run in the browser, not during SSR or static generation
  useEffect(() => {
    setIsClient(true);
    
    // Initialize search params from current URL
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    
    // Update params when the URL changes
    const handleRouteChange = () => {
      const newParams = new URLSearchParams(window.location.search);
      setSearchParams(newParams);
    };
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Safe methods that handle both client and server rendering
  const safeGet = (key: string): string | null => {
    // During SSR or static generation, always return null
    if (!isClient) return null;
    return searchParams?.get(key) || null;
  };
  
  const safeGetAll = (key: string): string[] => {
    if (!isClient) return [];
    return searchParams?.getAll(key) || [];
  };
  
  const safeHas = (key: string): boolean => {
    if (!isClient) return false;
    return searchParams?.has(key) || false;
  };
  
  const safeToString = (): string => {
    if (!isClient) return '';
    return searchParams?.toString() || '';
  };
  
  // Return an API similar to Next.js's useSearchParams
  return {
    get: safeGet,
    getAll: safeGetAll,
    has: safeHas,
    toString: safeToString,
    searchParams: isClient ? searchParams : null,
    isClient
  };
}
