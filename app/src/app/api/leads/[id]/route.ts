import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = neon(process.env.DATABASE_URL!);
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["new", "contacted", "claimed", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE professional_leads
      SET status = ${status}, updated_at = now()
      WHERE id = ${id}
      RETURNING id, status
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: result[0] });
  } catch (e: unknown) {
    console.error("Lead update error:", e);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
