'use client';

import dynamic from 'next/dynamic';

// Create a loading component for the dynamic import
function ActivatePageLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Loading...
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}

// Use dynamic import with SSR disabled to avoid window/location errors during static build
// This is the key fix for the "location is not defined" error
const ActivatePageContent = dynamic(
  () => import('./ActivatePageContent'),
  { ssr: false, loading: ActivatePageLoading }
);

// Export a simple wrapper that uses the dynamic component
export default function ActivatePage() {
  return <ActivatePageContent />;
}
