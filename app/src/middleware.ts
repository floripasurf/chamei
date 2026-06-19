import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminValue } from "@/lib/admin-auth";

// Defense-in-depth: block admin-only mutation endpoints unless the request
// carries a valid signed admin session cookie. The public lead-signup endpoint
// is POST /api/leads (no sub-path) and is intentionally NOT matched here.
export async function middleware(request: NextRequest) {
  const ok = await isValidAdminValue(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/leads/:path+"],
};
