import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminValue } from "@/lib/admin-auth";

// Defense-in-depth: block admin-only mutation endpoints unless the request
// carries a valid signed admin session cookie. The public lead-signup endpoint
// is POST /api/leads (no sub-path) and is intentionally NOT matched here.
export async function proxy(request: NextRequest) {
  const ok = await isValidAdminValue(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  // Admin-only mutation endpoints. Public submit endpoints are POST /api/leads
  // and POST /api/claim (no sub-path) and are intentionally NOT matched.
  matcher: ["/api/leads/:path+", "/api/claim/:path+"],
};
