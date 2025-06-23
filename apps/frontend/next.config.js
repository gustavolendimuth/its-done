const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Disable turbo for better stability in development
  experimental: {
    turbo: false,
  },
};

module.exports = withNextIntl(nextConfig);
