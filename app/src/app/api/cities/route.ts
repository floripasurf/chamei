import { NextResponse } from "next/server";
import { getCities } from "@/lib/cached-queries";

export async function GET() {
  const cities = await getCities();
  return NextResponse.json(
    { cities },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
