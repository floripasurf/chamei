import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendVerificationCode } from "@/lib/sms";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!);
  const { professional_id } = await request.json();

  if (!professional_id) {
    return NextResponse.json(
      { error: "Informe o ID do profissional" },
      { status: 400 }
    );
  }

  // Look up professional and their phone from the database
  const pros = await sql`
    SELECT id, phone, name, is_claimed FROM professionals
    WHERE id = ${professional_id} LIMIT 1
  `;

  if (pros.length === 0) {
    return NextResponse.json(
      { error: "Profissional não encontrado" },
      { status: 404 }
    );
  }

  const pro = pros[0];

  if (pro.is_claimed) {
    return NextResponse.json(
      { error: "Este perfil já foi reivindicado" },
      { status: 409 }
    );
  }

  const phoneOnFile = normalizePhone(pro.phone || "");
  if (phoneOnFile.length < 10) {
    return NextResponse.json(
      { error: "Este perfil não possui um telefone válido cadastrado" },
      { status: 400 }
    );
  }

  // Ensure table exists
  await sql`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      professional_id uuid NOT NULL,
      phone text NOT NULL,
      code text NOT NULL,
      created_at timestamptz DEFAULT now(),
      expires_at timestamptz NOT NULL,
      used boolean DEFAULT false
    )
  `;

  // Rate limit: max 3 codes per professional per hour
  const recentCodes = await sql`
    SELECT COUNT(*)::int as cnt FROM verification_codes
    WHERE professional_id = ${professional_id}
      AND created_at > now() - interval '1 hour'
  `;

  if (recentCodes[0]?.cnt >= 3) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store code (expires in 10 minutes)
  await sql`
    INSERT INTO verification_codes (professional_id, phone, code, expires_at)
    VALUES (${professional_id}, ${phoneOnFile}, ${code}, now() + interval '10 minutes')
  `;

  // Send SMS to the phone on file — the user never provides the number
  const result = await sendVerificationCode(phoneOnFile, code);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Falha ao enviar código" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
