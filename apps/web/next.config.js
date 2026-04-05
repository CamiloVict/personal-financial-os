/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@personal-finance-os/database', '@personal-finance-os/validation', '@personal-finance-os/types'],
};

module.exports = nextConfig;