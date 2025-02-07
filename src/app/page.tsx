'use client';

import dynamic from 'next/dynamic';

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
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <WaitlistSection />
    </main>
  );
}
