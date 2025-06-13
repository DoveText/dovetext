import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation'; 
// Vercel analytics removed to avoid CSP issues
import { AuthProvider } from '@/context/AuthContext';
import { ActionProvider } from '@/context/ActionContext';
import { ChatProvider } from '@/context/ChatContext';
import { UserTypeProvider } from '@/context/UserTypeContext';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import { Toaster } from 'react-hot-toast';

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
      <head>
        <Script
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "bd727714eee74ace850d189571796afa"}'
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <UserTypeProvider>
            <ActionProvider>
              <ChatProvider>
                <LoadingIndicator />
                <Navigation />
                <main className="min-h-screen flex flex-col">
                  {children}
                </main>
                <Footer />
                <Toaster position="top-right" toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#fff',
                    color: '#333',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                  },
                  success: {
                    style: {
                      borderLeft: '4px solid #10B981',
                    },
                  },
                  error: {
                    style: {
                      borderLeft: '4px solid #EF4444',
                    },
                    duration: 6000,
                  },
                }} />
              </ChatProvider>
            </ActionProvider>
          </UserTypeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
