import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Replay configuration
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === "development") {
            return null;
        }

        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
                if (breadcrumb.data) {
                    // Remove potential sensitive fields
                    delete breadcrumb.data.password;
                    delete breadcrumb.data.token;
                    delete breadcrumb.data.apiKey;
                }
                return breadcrumb;
            });
        }

        return event;
    },

    // Ignore common errors
    ignoreErrors: [
        // Browser extensions
        "top.GLOBALS",
        // Random plugins/extensions
        "originalCreateNotification",
        "canvas.contentDocument",
        "MyApp_RemoveAllHighlights",
        // Network errors
        "NetworkError",
        "Failed to fetch",
        // Aborted requests
        "AbortError",
    ],
});
