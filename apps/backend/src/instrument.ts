// dotenv first: this file runs before Nest's ConfigModule, so SENTRY_DSN must be loaded here.
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Keep the sampling rate low in production to save quota and overhead.
const sampleRate = process.env.NODE_ENV === 'production' ? 0.1 : 1.0;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.RAILWAY_ENVIRONMENT ?? process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: sampleRate,
  // Evaluated only once per SDK.init call
  profileSessionSampleRate: sampleRate,
  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
  dataCollection: {
    // No user data (IP, email); request bodies would include login credentials
    userInfo: false,
    httpBodies: [],
  },
});
