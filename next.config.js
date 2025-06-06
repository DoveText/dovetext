/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only use static export for production builds (GitHub Pages)
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    // Set basePath to match your GitHub repository name
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  }),
  // API proxy configuration for development
  ...(process.env.NODE_ENV !== 'production' && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://api.dovetext.cn/api/:path*',
        },
        {
          source: '/public/assets/:path*',
          destination: 'http://api.dovetext.cn/public/assets/:path*',
        },
      ];
    },
    // Add Content Security Policy headers for development
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.google.com http://127.0.0.1:* http://localhost:* http://*.dovetext.cn https://*.cloudflareinsights.com https://cloudflareinsights.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.google.com https://*.gstatic.com https://*.cloudflareinsights.com https://cloudflareinsights.com; media-src 'self'; worker-src 'self' blob:"
            }
          ]
        }
      ];
    },
  }),
  // Custom server settings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dovetext.com',
        pathname: '/public/assets/**',
      }
    ],
    unoptimized: true, // Skip image optimization to avoid timeout issues
  },
  // Server Actions are enabled by default in Next.js 14+
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];  // required for konva
    return config;
  },
  // For development only - headers don't work with static export
  // For GitHub Pages, you'll need to use a _headers file instead
  // See: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
  ...(process.env.NODE_ENV !== 'production' && {
    async headers() {
      const isDev = true; // Always dev mode when this runs
      const allowedDomains = ['http://127.0.0.1:*', 'http://localhost:*', 'http://*.dovetext.cn'];

      const baseDirectives = [
        "default-src 'self'",
        "style-src 'self' 'unsafe-inline' https://maxcdn.bootstrapcdn.com",
        "img-src 'self' data: blob: https: http://api.dovetext.cn https://api.dovetext.com https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
        "font-src 'self' https://maxcdn.bootstrapcdn.com",
        `connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com https://*.googleapis.com https://*.google.com ${allowedDomains.join(' ')}`,
        "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.google.com https://*.gstatic.com https://static.cloudflareinsights.com https://cloudflareinsights.com https://*.cloudflareinsights.com",
        "media-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'self' data:"
      ];

      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: baseDirectives.join('; ')
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
              value: '*'
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
  })
};

module.exports = nextConfig;
