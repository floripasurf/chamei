import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Reverse geocode using our own database — find the nearest city we have data for
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Find the most common city among nearby professionals
  const result = await sql`
    SELECT city, state, count(*) as total,
      min(6371 * acos(
        cos(radians(${lat})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(latitude))
      )) as min_distance
    FROM professionals
    WHERE is_active = true
      AND latitude IS NOT NULL
      AND city IS NOT NULL
    GROUP BY city, state
    ORDER BY min_distance ASC
    LIMIT 1
  `;

  if (result.length === 0) {
    return NextResponse.json({ city: null, state: null });
  }

  return NextResponse.json({
    city: result[0].city,
    state: result[0].state,
    total: result[0].total,
  });
}
