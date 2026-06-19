import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedAdminRequest(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        slug text NOT NULL UNIQUE,
        excerpt text NOT NULL,
        content text NOT NULL,
        cover_image_url text,
        category_slug text,
        tags text[] DEFAULT '{}',
        author text DEFAULT 'Chamei',
        published boolean DEFAULT false,
        published_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `;

    return NextResponse.json({ success: true, message: "Blog posts table created successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
