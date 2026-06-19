import { NextResponse } from "next/server";

// Legacy claim-by-last-4-digits route was REMOVED — it auto-approved profiles
// from 4 phone digits with no rate limit (brute-forceable account takeover).
// The claim flow now uses SMS verification: /api/verify/send + /api/verify/confirm.
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint descontinuado. Reivindique seu perfil pelo código enviado por SMS." },
    { status: 410 }
  );
}
