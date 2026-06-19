import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  // Cap radius/limit so a request can't force an unbounded heavy query.
  const radius = Math.min(Math.max(parseFloat(searchParams.get("radius") || "15") || 15, 1), 50); // km
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 50);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Haversine formula in SQL to calculate distance in km
  const professionals = await sql`
    SELECT *,
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(latitude))
      )) AS distance_km
    FROM professionals
    WHERE is_active = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    HAVING (6371 * acos(
        cos(radians(${lat})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(latitude))
      )) < ${radius}
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `;

  return NextResponse.json({ professionals, total: professionals.length });
}
