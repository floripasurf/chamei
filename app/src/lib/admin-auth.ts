// Server-side admin authentication.
//
// The admin session cookie holds an HMAC token derived from ADMIN_SECRET — not
// a forgeable static string. Verification recomputes the HMAC and compares in
// constant time. Implemented with Web Crypto so it runs in both the Edge
// middleware and Node route handlers.

const ADMIN_COOKIE = "admin_session";
const PAYLOAD = "chamei-admin-v1";
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return toHex(sig);
}

/** The signed value to store in the admin session cookie. */
export async function adminSessionValue(): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET not configured");
  return hmac(secret, PAYLOAD);
}

/** Validate a cookie value (fails closed if secret missing or value absent). */
export async function isValidAdminValue(value: string | undefined | null): Promise<boolean> {
  if (!value || !process.env.ADMIN_SECRET) return false;
  try {
    return safeEqual(value, await adminSessionValue());
  } catch {
    return false;
  }
}

/**
 * Authorize a request as admin: valid admin session cookie OR an x-admin-secret
 * header carrying the same signed token (hex, header-safe) — for automation/cron
 * that has no cookie. Compute the token with adminSessionValue().
 */
export async function isAuthorizedAdminRequest(request: {
  cookies: { get: (n: string) => { value: string } | undefined };
  headers: { get: (n: string) => string | null };
}): Promise<boolean> {
  if (await isValidAdminValue(request.cookies.get(ADMIN_COOKIE)?.value)) return true;
  return isValidAdminValue(request.headers.get("x-admin-secret"));
}

export { ADMIN_COOKIE };
