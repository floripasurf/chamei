import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const VALID_EVENTS = ["view", "whatsapp_click", "phone_click", "share"];

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS conversion_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      professional_id UUID REFERENCES professionals(id),
      event_type TEXT NOT NULL,
      session_id TEXT,
      referrer TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_conv_events_pro ON conversion_events(professional_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conv_events_type ON conversion_events(event_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conv_events_date ON conversion_events(created_at)`;
  tableReady = true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professional_id, event_type, session_id } = body;

    if (!professional_id || !event_type) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
    }

    await ensureTable();

    const sql = getDb();
    const referrer = request.headers.get("referer") || null;

    await sql`
      INSERT INTO conversion_events (professional_id, event_type, session_id, referrer)
      VALUES (${professional_id}, ${event_type}, ${session_id || null}, ${referrer})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
