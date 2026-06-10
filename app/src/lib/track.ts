/** Client-side conversion tracking via sendBeacon */

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("chamei_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("chamei_sid", sid);
  }
  return sid;
}

export function trackEvent(
  professionalId: string,
  eventType: "view" | "whatsapp_click" | "phone_click" | "share"
) {
  if (typeof navigator === "undefined") return;

  const payload = JSON.stringify({
    professional_id: professionalId,
    event_type: eventType,
    session_id: getSessionId(),
  });

  try {
    const sent = navigator.sendBeacon(
      "/api/track",
      new Blob([payload], { type: "application/json" })
    );
    if (!sent) {
      fetch("/api/track", { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    // Tracking should never break the UI
  }
}
