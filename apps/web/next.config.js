/** @type {import('next').NextConfig} */
const nestBackend = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001'
).replace(/\/+$/, '');

const nextConfig = {
  transpilePackages: [
    '@personal-finance-os/database',
    '@personal-finance-os/validation',
    '@personal-finance-os/types',
    '@personal-finance-os/explanation',
    '@personal-finance-os/tax-engine',
  ],
  async rewrites() {
    return [
      { source: '/api/nest', destination: `${nestBackend}/` },
      { source: '/api/nest/', destination: `${nestBackend}/` },
      { source: '/api/nest/:path*', destination: `${nestBackend}/:path*` },
    ];
  },
};

module.exports = nextConfig;