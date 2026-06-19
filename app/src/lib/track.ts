// Client-side event tracking helper.
// Persists events server-side (via /api/events) so monetization insights don't
// depend on Google Analytics sampling. Uses sendBeacon when available so the
// request survives navigation away from the page (e.g. opening wa.me).

type ContactEvent = {
  type: "contact";
  professional_id: string;
  channel: "whatsapp" | "phone";
  source?: "profile" | "card" | "search";
  result_position?: number; // 1-based rank at click time (ranked lists only)
};

type SearchEvent = {
  type: "search";
  category_slug?: string;
  source: "category_browse";
  result_count?: number;
};

/** Stable first-party visitor id (for honest dedup of contacts/searches). */
function visitorId(): string {
  try {
    let v = localStorage.getItem("chamei_vid");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("chamei_vid", v);
    }
    return v;
  } catch {
    return "anon";
  }
}

export function trackEvent(event: ContactEvent | SearchEvent): void {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      ...event,
      visitor_id: visitorId(),
      pathname: window.location.pathname,
    };
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }

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

/** Read the visitor id for callers that pass it through other channels (e.g. the search API). */
export function getVisitorId(): string {
  return visitorId();
}
