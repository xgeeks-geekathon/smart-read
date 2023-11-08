/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  webpack5: true,
    webpack: (config) => {
      config.resolve.fallback = { tls: false,  "crypto": false };
  
      return config;
    },
};
