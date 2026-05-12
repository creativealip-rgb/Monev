export type ProductEventName =
    | "view_mode_selected"
    | "view_mode_changed"
    | "simple_dashboard_viewed"
    | "advanced_feature_prompt_viewed"
    | "advanced_feature_prompt_accepted"
    | "advanced_feature_prompt_dismissed";

type ProductEventPayload = Record<string, string | number | boolean | null | undefined>;

export function trackProductEvent(name: ProductEventName, payload: ProductEventPayload = {}) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent("monev:product-event", { detail: { name, payload } }));

    const analyticsTargets = [
        () => window.gtag?.("event", name, payload),
        () => window.plausible?.(name, { props: payload }),
        () => window.posthog?.capture?.(name, payload),
    ];

    for (const send of analyticsTargets) {
        try {
            send();
        } catch {
            // Optional analytics integrations must never break product flows.
        }
    }

    if (process.env.NODE_ENV !== "production") {
        console.info("[product-event]", name, payload);
    }
}

declare global {
    interface Window {
        gtag?: (command: "event", eventName: string, payload?: ProductEventPayload) => void;
        plausible?: (eventName: string, options?: { props?: ProductEventPayload }) => void;
        posthog?: { capture?: (eventName: string, payload?: ProductEventPayload) => void };
    }
}
