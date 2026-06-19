import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!);
  const { professional_id, phone_digits } = await request.json();

  if (!professional_id || !phone_digits || phone_digits.length !== 4) {
    return NextResponse.json({ error: "Informe os 4 últimos dígitos do telefone" }, { status: 400 });
  }

  // Verify the phone matches
  const pros = await sql`
    SELECT id, phone, name FROM professionals WHERE id = ${professional_id} LIMIT 1
  `;

  if (pros.length === 0) {
    return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
  }

  const pro = pros[0];
  const cleanPhone = (pro.phone || "").replace(/\D/g, "");
  const lastFour = cleanPhone.slice(-4);

  if (phone_digits !== lastFour) {
    return NextResponse.json({ error: "Os dígitos não correspondem ao telefone cadastrado" }, { status: 400 });
  }

  // Check if there's already an approved claim
  const existingApproved = await sql`
    SELECT id FROM profile_claims
    WHERE professional_id = ${professional_id} AND status = 'approved'
    LIMIT 1
  `;

  if (existingApproved.length > 0) {
    return NextResponse.json({ error: "Já existe uma solicitação aprovada para este perfil" }, { status: 409 });
  }

  // Check if there's already a pending claim
  const existing = await sql`
    SELECT id FROM profile_claims
    WHERE professional_id = ${professional_id} AND status = 'pending'
    LIMIT 1
  `;

  if (existing.length > 0) {
    return NextResponse.json({ error: "Já existe uma solicitação pendente para este perfil" }, { status: 409 });
  }

  // Ensure session_token column exists
  try {
    await sql`ALTER TABLE profile_claims ADD COLUMN IF NOT EXISTS session_token text`;
  } catch {
    // Column may already exist, ignore
  }

  // Phone matches — auto-approve and generate session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const code = `CHAMEI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Insert approved claim with session token
  await sql`
    INSERT INTO profile_claims (professional_id, phone_provided, claim_code, status, session_token)
    VALUES (${professional_id}, ${cleanPhone}, ${code}, 'approved', ${sessionToken})
  `;

  // Update professional to claimed status
  await sql`
    UPDATE professionals
    SET is_claimed = true, claimed_at = now(), tier = 'claimed'
    WHERE id = ${professional_id}
  `;

  // Build response with session cookie
  const response = NextResponse.json({
    success: true,
    code,
    name: pro.name,
    approved: true,
  });

  response.cookies.set("chamei_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
