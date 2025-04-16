import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation'; 
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthProvider } from '@/context/AuthContext';
import { ActionProvider } from '@/context/ActionContext';
import { ChatProvider } from '@/context/ChatContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DoveText - Smart Notifications Reimagined',
  description: 'Your digital life, curated with intelligence',
  keywords: ['AI notifications', 'smart alerts', 'intelligent scheduling', 'notification management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/src/app/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ActionProvider>
            <ChatProvider>
              <Navigation />
              <main className="min-h-screen flex flex-col">
                {children}
              </main>
              <Footer />
            </ChatProvider>
          </ActionProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
