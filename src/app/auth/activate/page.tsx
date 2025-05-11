'use client';

import dynamic from 'next/dynamic';

// Create a loading component for the dynamic import
function ActivatePageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading activation page...</p>
      </div>
    </div>
  );
}

// Use dynamic import with SSR disabled to prevent window.location errors during static build
const ActivatePageContent = dynamic(
  () => import('./ActivatePageContent'),
  { ssr: false, loading: ActivatePageLoading }
);

// Export a simple wrapper that uses the dynamic component
export default function ActivatePage() {
  return <ActivatePageContent />;
}
