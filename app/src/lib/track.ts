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

function send(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      ...payload,
      visitor_id: visitorId(),
      pathname: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
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

export function trackEvent(event: ContactEvent | SearchEvent): void {
  send(event);
}

// Viewport-accurate impressions: cards enqueue themselves when they actually
// scroll into view (via IntersectionObserver). We buffer and flush in batches
// (debounced + on page hide) so we don't send one request per card.
type ImpressionItem = { professional_id: string; position: number; page_type: string };
let buffer: ImpressionItem[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const seenImpressions = new Set<string>();
let unloadHooked = false;

function flushImpressions(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!buffer.length) return;
  const items = buffer.slice(0, 50);
  buffer = buffer.slice(50);
  send({ type: "impression", items });
  if (buffer.length) scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flushImpressions, 1500);
}

export function enqueueImpression(item: ImpressionItem): void {
  if (typeof window === "undefined") return;
  // Once per professional+page_type per page session.
  const key = `${item.professional_id}:${item.page_type}`;
  if (seenImpressions.has(key)) return;
  seenImpressions.add(key);
  buffer.push(item);
  scheduleFlush();
  if (!unloadHooked) {
    unloadHooked = true;
    // Flush whatever's buffered before the page goes away.
    window.addEventListener("pagehide", flushImpressions);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushImpressions();
    });
  }
}

/** A visit to a professional's profile page. */
export function trackProfileView(professionalId: string): void {
  send({ type: "profile_view", professional_id: professionalId });
}

/** Read the visitor id for callers that pass it through other channels (e.g. the search API). */
export function getVisitorId(): string {
  return visitorId();
}
