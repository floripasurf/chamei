import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

async function getAuthenticatedProfessionalId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("chamei_session")?.value;
  if (!token) return null;

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT p.id
    FROM profile_claims pc
    JOIN professionals p ON pc.professional_id = p.id
    WHERE pc.session_token = ${token} AND pc.status = 'approved'
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0].id as string) : null;
}

export async function GET() {
  const professionalId = await getAuthenticatedProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Ensure professional_photos table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS professional_photos (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        professional_id uuid REFERENCES professionals(id),
        url text NOT NULL,
        caption text,
        sort_order integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;
  } catch {
    // Table may already exist
  }

  const photos = await sql`
    SELECT id, url, caption
    FROM professional_photos
    WHERE professional_id = ${professionalId}
    ORDER BY sort_order ASC, created_at DESC
  `;

  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  const professionalId = await getAuthenticatedProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 });
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "A imagem deve ter no máximo 5MB" }, { status: 400 });
  }

  // Create upload directory
  const uploadDir = path.join(process.cwd(), "public", "uploads", professionalId);
  await mkdir(uploadDir, { recursive: true });

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Write file
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const url = `/uploads/${professionalId}/${filename}`;

  // Ensure table exists and insert
  const sql = neon(process.env.DATABASE_URL!);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS professional_photos (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        professional_id uuid REFERENCES professionals(id),
        url text NOT NULL,
        caption text,
        sort_order integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      )
    `;
  } catch {
    // Table may already exist
  }

  const rows = await sql`
    INSERT INTO professional_photos (professional_id, url)
    VALUES (${professionalId}, ${url})
    RETURNING id, url, caption
  `;

  return NextResponse.json({ photo: rows[0] });
}

export async function DELETE(request: NextRequest) {
  const professionalId = await getAuthenticatedProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("id");

  if (!photoId) {
    return NextResponse.json({ error: "ID da foto é obrigatório" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Verify ownership and get the URL
  const photos = await sql`
    SELECT id, url FROM professional_photos
    WHERE id = ${photoId} AND professional_id = ${professionalId}
    LIMIT 1
  `;

  if (photos.length === 0) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
  }

  const photo = photos[0];

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", photo.url as string);
    await unlink(filePath);
  } catch {
    // File may not exist on disk, continue with DB deletion
  }

  // Delete from database
  await sql`DELETE FROM professional_photos WHERE id = ${photoId}`;

  return NextResponse.json({ success: true });
}
