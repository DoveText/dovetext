import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation'; 
// Vercel analytics removed to avoid CSP issues
import { AuthProvider } from '@/context/AuthContext';
import { ActionProvider } from '@/context/ActionContext';
import { ChatProvider } from '@/context/ChatContext';
import LoadingIndicator from '@/components/common/LoadingIndicator';

const inter = Inter({ subsets: ['latin'] });

// This function allows us to generate dynamic metadata based on environment variables
function generateMetadata(): Metadata {
  // Get the base path from environment variable or default to empty string
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  return {
    title: 'DoveText - Smart Notifications Reimagined',
    description: 'Your digital life, curated with intelligence',
    keywords: ['AI notifications', 'smart alerts', 'intelligent scheduling', 'notification management'],
    icons: {
      icon: `${basePath}/favicon.ico`,
    },
  };
};

// For backward compatibility
export const metadata = generateMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ActionProvider>
            <ChatProvider>
              <LoadingIndicator />
              <Navigation />
              <main className="min-h-screen flex flex-col">
                {children}
              </main>
              <Footer />
            </ChatProvider>
          </ActionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
