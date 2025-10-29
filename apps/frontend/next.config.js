/* eslint-env node */
const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable turbo for better stability in development
  experimental: {
    turbo: {
      enabled: false,
    },
  },

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://backend-its-done.up.railway.app",
  },

  // Explicitly set public runtime config
  publicRuntimeConfig: {
    apiUrl:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://backend-its-done.up.railway.app",
  },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "muth",
  project: "its-done",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: true,
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions);
