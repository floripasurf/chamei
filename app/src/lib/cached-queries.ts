import { unstable_cache } from "next/cache";
import { getDb } from "./db";

type Category = { id: string; name: string; slug: string };
type CityAgg = { city: string; state: string | null; total: number };

const ONE_HOUR = 3600;

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const sql = getDb();
      const rows = await sql`SELECT id, name, slug FROM categories ORDER BY name`;
      return rows as Category[];
    } catch (err) {
      console.error("[cached-queries] getCategories failed", err);
      return [];
    }
  },
  ["categories"],
  { revalidate: ONE_HOUR, tags: ["categories"] }
);

export const getCities = unstable_cache(
  async (): Promise<CityAgg[]> => {
    try {
      const sql = getDb();
      const rows = await sql`
        SELECT city, state, count(*)::int as total
        FROM professionals
        WHERE is_active = true AND city IS NOT NULL
        GROUP BY city, state
        ORDER BY total DESC
      `;
      return rows as CityAgg[];
    } catch (err) {
      console.error("[cached-queries] getCities failed", err);
      return [];
    }
  },
  ["cities"],
  { revalidate: ONE_HOUR, tags: ["cities"] }
);

export const getTotalActiveProfessionals = unstable_cache(
  async (): Promise<number> => {
    try {
      const sql = getDb();
      const rows = await sql`SELECT count(*)::int as total FROM professionals WHERE is_active = true`;
      return rows[0]?.total ?? 0;
    } catch (err) {
      console.error("[cached-queries] getTotalActiveProfessionals failed", err);
      return 0;
    }
  },
  ["total-active-professionals"],
  { revalidate: ONE_HOUR, tags: ["professionals"] }
);
