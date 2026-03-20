import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

async function getAuthenticatedProfessional() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chamei_session")?.value;
  if (!token) return null;

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT p.id, p.name, p.whatsapp, p.phone, p.description, p.neighborhood, p.hours
    FROM profile_claims pc
    JOIN professionals p ON pc.professional_id = p.id
    WHERE pc.session_token = ${token} AND pc.status = 'approved'
    LIMIT 1
  `;

  return rows.length > 0 ? rows[0] : null;
}

export async function GET() {
  const pro = await getAuthenticatedProfessional();
  if (!pro) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.json({ professional: pro });
}

export async function PUT(request: NextRequest) {
  const pro = await getAuthenticatedProfessional();
  if (!pro) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, whatsapp, description, neighborhood, hours, years_experience } = body;

  // Validate
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  if (description && description.length > 500) {
    return NextResponse.json({ error: "Descrição deve ter no máximo 500 caracteres" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Ensure years_experience column exists
  try {
    await sql`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS years_experience integer`;
  } catch {
    // Column may already exist
  }

  await sql`
    UPDATE professionals
    SET
      name = ${name.trim()},
      whatsapp = ${whatsapp || null},
      description = ${description || null},
      neighborhood = ${neighborhood || null},
      hours = ${hours || null},
      years_experience = ${years_experience || null},
      updated_at = now()
    WHERE id = ${pro.id}
  `;

  return NextResponse.json({ success: true });
}
