import { NextResponse } from "next/server";
import { getSessionProfessional } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const pro = await getSessionProfessional();
  if (!pro) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    const stats7 = await sql`
      SELECT
        count(*) FILTER (WHERE event_type = 'view') as views,
        count(*) FILTER (WHERE event_type = 'whatsapp_click') as whatsapp,
        count(*) FILTER (WHERE event_type = 'phone_click') as calls
      FROM conversion_events
      WHERE professional_id = ${pro.id}
        AND created_at >= now() - interval '7 days'
    `;

    const stats30 = await sql`
      SELECT
        count(*) FILTER (WHERE event_type = 'view') as views,
        count(*) FILTER (WHERE event_type = 'whatsapp_click') as whatsapp,
        count(*) FILTER (WHERE event_type = 'phone_click') as calls
      FROM conversion_events
      WHERE professional_id = ${pro.id}
        AND created_at >= now() - interval '30 days'
    `;

    return NextResponse.json({
      "7d": {
        views: Number(stats7[0].views),
        whatsapp: Number(stats7[0].whatsapp),
        calls: Number(stats7[0].calls),
      },
      "30d": {
        views: Number(stats30[0].views),
        whatsapp: Number(stats30[0].whatsapp),
        calls: Number(stats30[0].calls),
      },
    });
  } catch {
    // Table may not exist yet — return zeros
    return NextResponse.json({
      "7d": { views: 0, whatsapp: 0, calls: 0 },
      "30d": { views: 0, whatsapp: 0, calls: 0 },
    });
  }
}
