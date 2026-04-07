import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Servidor mal configurado" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { password } = body;

  if (password === adminPassword) {
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
