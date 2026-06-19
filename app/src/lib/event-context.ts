import type { NextRequest } from "next/server";

// Non-reversible request context for event enrichment. UA/IP are HMAC-hashed
// (never stored raw) so they can serve as a dedup/fraud fallback without holding
// raw personal data (LGPD).
async function hmacHex(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function requestContext(req: NextRequest) {
  const salt = process.env.ADMIN_SECRET || "chamei-event-salt";
  const ua = req.headers.get("user-agent") || "";
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const referrer = req.headers.get("referer");
  return {
    uaHash: ua ? await hmacHex(salt, "ua:" + ua) : null,
    ipHash: ip ? await hmacHex(salt, "ip:" + ip) : null,
    referrer: referrer ? referrer.slice(0, 300) : null,
  };
}
