import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://77f6ee0780da50618a3a153c72219d58@o4511403839979520.ingest.us.sentry.io/4511403846860800',
  tracesSampleRate: 1.0,
  debug: false,
});
