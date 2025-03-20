'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const HeroSection = dynamic(() => import('@/components/HeroSection'), {
  ssr: false
});

const FeaturesSection = dynamic(() => import('@/components/FeaturesSection'), {
  ssr: false
});

const WaitlistSection = dynamic(() => import('@/components/WaitlistSection'), {
  ssr: false
});

const DemoSection = dynamic(() => import('@/components/DemoSection'), {
  ssr: false
});

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // If user is authenticated, don't render the landing page content
  // This prevents a flash of content before redirect
  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <WaitlistSection />
    </main>
  );
}
