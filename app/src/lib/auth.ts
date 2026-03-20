import { cookies } from "next/headers";
import { getDb } from "./db";

export async function getSessionProfessional() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chamei_session")?.value;
  if (!token) return null;

  const sql = getDb();
  const rows = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM profile_claims pc
    JOIN professionals p ON pc.professional_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE pc.session_token = ${token} AND pc.status = 'approved'
    LIMIT 1
  `;

  return rows.length > 0 ? rows[0] : null;
}
