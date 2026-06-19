// Client-side event tracking helper.
// Persists events server-side (via /api/events) so monetization insights don't
// depend on Google Analytics sampling. Uses sendBeacon when available so the
// request survives navigation away from the page (e.g. opening wa.me).

type ContactEvent = {
  type: "contact";
  professional_id: string;
  channel: "whatsapp" | "phone";
  source?: "profile" | "card" | "search";
};

type SearchEvent = {
  type: "search";
  query?: string;
  category_slug?: string;
  source: "search" | "category_browse";
  result_count?: number;
};

export function trackEvent(event: ContactEvent | SearchEvent): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(event);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }

    // Fallback: keepalive fetch (fire-and-forget, survives unload).
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Never let analytics break the user flow.
  }
}
