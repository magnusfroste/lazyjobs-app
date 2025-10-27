import * as Sentry from '@sentry/react'

export function initSentry(): void {
  // Initialize Sentry with your DSN
  const dsn: string =
    import.meta.env.VITE_SENTRY_DSN ||
    'https://a381f9d7002ff772b209e99514418d68@o4510223842344960.ingest.de.sentry.io/4510223846342736'

  // Only initialize in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Send default PII (IP address, user agent)
      sendDefaultPii: true,
      // Environment
      environment: import.meta.env.MODE,
    })

    console.log('✅ Sentry initialized')
  }
}
