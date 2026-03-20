import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = neon(process.env.DATABASE_URL!);
  const { status } = await request.json();

  if (!["verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  const claims = await sql`
    SELECT professional_id FROM profile_claims WHERE id = ${id} LIMIT 1
  `;

  if (claims.length === 0) {
    return NextResponse.json({ error: "Claim nao encontrado" }, { status: 404 });
  }

  await sql`UPDATE profile_claims SET status = ${status} WHERE id = ${id}`;

  // If verified, mark the professional as claimed
  if (status === "verified") {
    await sql`
      UPDATE professionals
      SET is_claimed = true, tier = 'claimed', claimed_at = now(), source = 'claimed'
      WHERE id = ${claims[0].professional_id}
    `;
  }

  return NextResponse.json({ success: true });
}
