/** @type {import('next').NextConfig} */
const allowedOrigin = (process.env.ALLOWED_ORIGINS || '').split(',')[0]?.trim() || '';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    const corsHeaders = allowedOrigin
      ? [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ]
      : [];

    return [
      {
        source: '/api/:path*',
        headers: [
          ...corsHeaders,
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
