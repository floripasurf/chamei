import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const categories = await sql`SELECT id, name, slug FROM categories ORDER BY name`;
  return NextResponse.json({ categories });
}
