import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[àáâãä]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Get the lead
    const leads = await sql`
      SELECT pl.*, c.slug as category_slug
      FROM professional_leads pl
      LEFT JOIN categories c ON pl.category_id = c.id
      WHERE pl.id = ${id}
    `;

    if (leads.length === 0) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    const lead = leads[0];

    // Generate unique slug
    const baseSlug = slugify(lead.name);
    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    // Create the professional profile
    const result = await sql`
      INSERT INTO professionals (
        name, slug, category_id, whatsapp, phone,
        neighborhood, description, source,
        is_claimed, is_verified, tier, is_active
      ) VALUES (
        ${lead.name},
        ${slug},
        ${lead.category_id},
        ${lead.whatsapp},
        ${lead.whatsapp},
        ${lead.neighborhood},
        ${lead.description},
        'manual',
        true,
        true,
        'claimed',
        true
      )
      RETURNING id, slug
    `;

    const professional = result[0];

    // Update lead status to approved
    await sql`
      UPDATE professional_leads
      SET status = 'claimed'
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      professional: {
        id: professional.id,
        slug: professional.slug,
        url: `/profissional/${professional.slug}`,
      },
    });
  } catch (e: unknown) {
    console.error("Approve error:", e);
    return NextResponse.json({ error: "Erro ao aprovar" }, { status: 500 });
  }
}
