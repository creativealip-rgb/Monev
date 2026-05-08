import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Filter out sensitive data
    beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === "development") {
            return null;
        }

        // Remove sensitive data
        if (event.request) {
            // Remove authorization headers
            if (event.request.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }

            // Remove sensitive query params
            if (event.request.query_string) {
                const params = new URLSearchParams(event.request.query_string);
                params.delete("token");
                params.delete("apiKey");
                params.delete("password");
                event.request.query_string = params.toString();
            }
        }

        return event;
    },

    // Ignore common errors
    ignoreErrors: [
        "ECONNRESET",
        "ETIMEDOUT",
        "ENOTFOUND",
        "NetworkError",
    ],
});
