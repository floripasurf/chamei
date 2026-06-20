import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const cities = await sql`
    SELECT city, state, count(*) as total
    FROM professionals
    WHERE is_active = true AND city IS NOT NULL
    GROUP BY city, state
    ORDER BY total DESC
  `;
  // Cache na CDN por 1h (lista muda devagar) sem prerender no build.
  return NextResponse.json(
    { cities },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
