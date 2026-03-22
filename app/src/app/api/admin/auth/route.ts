import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "chamei2026";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", "authenticated", {
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
