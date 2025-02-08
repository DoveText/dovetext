/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Custom server settings
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Security headers configuration
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Define allowed domains
    const allowedDomains = isDev 
      ? ['localhost:3000', 'localhost:*'] 
      : ['dovetext.com', '*.dovetext.com'];

    // Base CSP directives that are safe for both dev and prod
    const baseDirectives = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      `connect-src 'self' https://*.googleapis.com https://*.google.com https://va.vercel-scripts.com https://*.vercel.app https://*.vercel.com ${allowedDomains.map(domain => `https://${domain}`).join(' ')}`,
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.google.com https://*.gstatic.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://*.vercel.app https://*.vercel.com",
      "media-src 'self'",
      "worker-src 'self' blob:"
    ];

    // Development-only directives
    const devDirectives = [
      ...baseDirectives,
    ];

    // Production-only directives
    const prodDirectives = [
      ...baseDirectives,
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ];

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: (isDev ? devDirectives : prodDirectives).join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Access-Control-Allow-Origin',
            // In production, only allow your domains
            value: isDev ? '*' : 'https://*.dovetext.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          }
        ],
      }
    ];
  }
};

module.exports = nextConfig;
