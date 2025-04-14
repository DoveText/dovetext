'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication and redirect if not authenticated
    if (!loading) {
      if (!user) {
        router.push('/signin?redirect=/admin-tools/prompts');
      } else if (user.settings?.role !== 'admin') {
        // Redirect non-admin users
        router.push('/dashboard');
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 shadow-lg rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Admin Tools</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as {user?.email}
            </span>
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
