import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!);
  const body = await request.json();

  const { name, whatsapp, category_id, neighborhood, experience_years, description } = body;

  if (!name || !whatsapp || !category_id) {
    return NextResponse.json(
      { error: "name, whatsapp e categoria sao obrigatorios" },
      { status: 400 }
    );
  }

  // Clean whatsapp number
  const cleanWhatsapp = whatsapp.replace(/\D/g, "");
  if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 13) {
    return NextResponse.json(
      { error: "Numero de WhatsApp invalido" },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      INSERT INTO professional_leads (name, whatsapp, category_id, neighborhood, experience_years, description)
      VALUES (${name}, ${cleanWhatsapp}, ${category_id}, ${neighborhood || null}, ${experience_years || null}, ${description || null})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (e: unknown) {
    console.error("Lead creation error:", e);
    return NextResponse.json(
      { error: "Erro ao salvar cadastro" },
      { status: 500 }
    );
  }
}
