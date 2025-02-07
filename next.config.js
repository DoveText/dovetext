/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  // Allow WebSocket connections
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      };
    }
    return config;
  },
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

    // Base CSP directives that are safe for both dev and prod
    const baseDirectives = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' ws: wss: http: https:", // for API and WebSocket connections
      "frame-src 'self'",
      "media-src 'self'",
      "worker-src 'self' blob:"
    ];

    // Development-only directives
    const devDirectives = [
      ...baseDirectives,
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'" // needed for hot reloading
    ];

    // Production-only directives
    const prodDirectives = [
      ...baseDirectives,
      "script-src 'self' 'unsafe-inline'", // only inline scripts, no eval
      "upgrade-insecure-requests", // upgrade HTTP to HTTPS
      "block-all-mixed-content" // prevent mixed content
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
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },
}

module.exports = nextConfig
