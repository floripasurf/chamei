import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValue } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Servidor mal configurado" }, { status: 500 });
  }

  const body = await request.json();
  const { password } = body;

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });
    // Signed HMAC token (not a forgeable static string).
    response.cookies.set(ADMIN_COOKIE, await adminSessionValue(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
}
