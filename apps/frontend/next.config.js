const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Disable turbo for better stability in development
  experimental: {
    turbo: {
      enabled: false,
    },
  },

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.estafeito.app.br",
  },

  // Explicitly set public runtime config
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.estafeito.app.br",
  },
};

module.exports = withNextIntl(nextConfig);
