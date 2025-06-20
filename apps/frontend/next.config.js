/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure CSS is properly handled
  experimental: {
    turbo: {
      rules: {
        '*.css': ['css-loader'],
      },
    },
  },
  // Force CSS recompilation in dev mode
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
        poll: 1000,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
