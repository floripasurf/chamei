import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";

// IndexNow API — instant indexing for Bing, Yandex, etc.
// Call this endpoint after importing new professionals (admin cookie or x-admin-secret).
// Accepts an optional `urlList` array in the request body (max 10,000 per IndexNow protocol).
// If `urlList` is provided, it is submitted directly; otherwise the route builds its own list from the DB.
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdminRequest(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // IndexNow key (filename without extension = key value)
  const key = "chamei-indexnow-key-2026";

  let urls: string[];

  // Check if caller supplied an explicit urlList
  let body: { urlList?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — fall through to DB-built list
  }

  if (
    Array.isArray(body.urlList) &&
    body.urlList.length > 0 &&
    body.urlList.every((u) => typeof u === "string")
  ) {
    // Caller-supplied list — only allow chamei.app URLs (open-relay guard), up to 10,000
    urls = (body.urlList as string[])
      .filter((u) => typeof u === "string" && u.startsWith("https://chamei.app/"))
      .slice(0, 10000);
  } else {
    // Build list from DB (original behaviour)
    const sql = neon(process.env.DATABASE_URL!);

    const pros = await sql`
      SELECT slug FROM professionals
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT 100
    `;

    const categories = await sql`SELECT slug FROM categories`;

    const blogPosts = await sql`
      SELECT slug FROM blog_posts WHERE published = true ORDER BY published_at DESC
    `;

    urls = [
      "https://chamei.app",
      "https://chamei.app/para-profissionais",
      "https://chamei.app/eletricista-sp",
      "https://chamei.app/buscar",
      "https://chamei.app/blog",
      ...categories.map((c) => `https://chamei.app/categoria/${c.slug}`),
      ...blogPosts.map((b) => `https://chamei.app/blog/${b.slug}`),
      ...pros.map((p) => `https://chamei.app/profissional/${p.slug}`),
    ];
  }

  try {
    const submittedUrls = urls.slice(0, 10000);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: "chamei.app",
        key,
        keyLocation: `https://chamei.app/${key}.txt`,
        urlList: submittedUrls,
      }),
    });

    return NextResponse.json({
      success: true,
      status: res.status,
      urlsSubmitted: submittedUrls.length,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
