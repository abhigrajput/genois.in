const nextConfig = {
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 60,
  },
  experimental: {
    serverActions: {
      // FIX 06: Server Actions body limit
      bodySizeLimit: '1mb',
    },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
          },
          // X-XSS-Protection is deprecated and has been removed. Modern browsers
          // ignore it, and `1; mode=block` has introduced DOM-XSS in some
          // historical edge cases. Setting to `0` to explicitly disable.
          {
            key: 'X-XSS-Protection',
            value: '0',
          },
          // FIX 07: Missing headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.google.com https://api.anthropic.com https://integrate.api.nvidia.com https://googleapis.com https://www.googleapis.com https://region1.google-analytics.com https://www.youtube.com https://youtube.com https://youtubei.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googletagmanager.com https://tagmanager.google.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.genois.in',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // FIX 06: Tell proxies/CDNs the max body size
          {
            key: 'X-Max-Body-Size',
            value: '1048576', // 1 MB in bytes
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
