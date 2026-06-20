import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const categories = await sql`SELECT id, name, slug FROM categories ORDER BY name`;
  // Cache na CDN por 1h (categorias quase nunca mudam) sem prerender no build.
  return NextResponse.json(
    { categories },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
