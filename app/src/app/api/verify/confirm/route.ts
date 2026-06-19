import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!);
  const { professional_id, code } = await request.json();

  if (!professional_id || !code) {
    return NextResponse.json(
      { error: "Dados incompletos" },
      { status: 400 }
    );
  }

  // Look up the latest valid code for this professional (NOT matched by code, so
  // we can count wrong guesses and block brute-force on the 6-digit code).
  const codes = await sql`
    SELECT id, phone, code, attempts FROM verification_codes
    WHERE professional_id = ${professional_id}
      AND used = false
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (codes.length === 0) {
    return NextResponse.json(
      { error: "Código inválido ou expirado" },
      { status: 400 }
    );
  }

  const record = codes[0];

  // Anti brute-force: after 5 wrong guesses, burn the code.
  if ((record.attempts ?? 0) >= 5) {
    await sql`UPDATE verification_codes SET used = true WHERE id = ${record.id}`;
    return NextResponse.json(
      { error: "Muitas tentativas. Solicite um novo código." },
      { status: 429 }
    );
  }

  if (String(record.code) !== String(code)) {
    await sql`UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ${record.id}`;
    return NextResponse.json(
      { error: "Código inválido ou expirado" },
      { status: 400 }
    );
  }

  const verifiedPhone = record.phone;

  // Correct code — mark as used.
  await sql`
    UPDATE verification_codes SET used = true WHERE id = ${record.id}
  `;

  // Ensure session_token column exists
  try {
    await sql`ALTER TABLE profile_claims ADD COLUMN IF NOT EXISTS session_token text`;
  } catch {
    // Column may already exist
  }

  // Generate session token and claim code
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const claimCode = `CHAMEI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Create approved claim
  await sql`
    INSERT INTO profile_claims (professional_id, phone_provided, claim_code, status, session_token)
    VALUES (${professional_id}, ${verifiedPhone}, ${claimCode}, 'approved', ${sessionToken})
  `;

  // Update professional
  await sql`
    UPDATE professionals
    SET is_claimed = true,
        claimed_at = now(),
        tier = 'claimed',
        whatsapp = ${verifiedPhone}
    WHERE id = ${professional_id}
  `;

  // Build response with session cookie
  const response = NextResponse.json({
    success: true,
    code: claimCode,
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
