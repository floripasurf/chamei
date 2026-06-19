import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { Professional, ReviewImported } from "@/lib/types";
import ContactSidebar from "./contact-sidebar";
import ShareProfileButton from "./share-profile-button";
import TrackedPhoneLink from "./tracked-phone-link";
import ProfileViewTracker from "./profile-view-tracker";
import MobileContactBar from "./mobile-contact-bar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT p.name, p.google_rating, p.google_review_count, p.city,
             c.name as category_name
      FROM professionals p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { title: "Profissional não encontrado | Chamei" };
    }

    const pro = rows[0];
    const city = pro.city ? ` em ${pro.city}` : "";
    const title = `${pro.name} - ${pro.category_name}${city} | Chamei`;

    const ratingPart =
      pro.google_rating && pro.google_review_count
        ? ` Nota ${pro.google_rating} com ${pro.google_review_count} avaliações.`
        : "";

    const description = `${pro.name} é ${pro.category_name?.toLowerCase()}${city}.${ratingPart} Veja avaliações, contato e mais no Chamei.`;

    return { title, description };
  } catch (err) {
    console.error("[profissional] generateMetadata db failed", err);
    return { title: "Chamei" };
  }
}

function StarRating({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "lg" }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const cls = size === "lg" ? "text-yellow-500 text-xl" : "text-yellow-500 text-sm";
  return (
    <span className={cls}>
      {"★".repeat(full)}
      {hasHalf && "½"}
      {"☆".repeat(5 - full - (hasHalf ? 1 : 0))}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    imported: "bg-gray-100 text-gray-600",
    claimed: "bg-blue-100 text-blue-700",
    verified: "bg-green-100 text-green-700",
    expert: "bg-purple-100 text-purple-700",
    master: "bg-yellow-100 text-yellow-800",
  };
  const labels: Record<string, string> = {
    imported: "Perfil do Google",
    claimed: "Cadastrado",
    verified: "Verificado",
    expert: "Especialista",
    master: "Master",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[tier] || styles.imported}`}>
      {labels[tier] || tier}
    </span>
  );
}

export default async function ProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  type ProRow = Professional & { category_name: string; category_slug: string };
  let pro: ProRow | null = null;
  let importedReviews: ReviewImported[] = [];
  let dbDown = false;

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM professionals p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;
    pro = (rows[0] as ProRow) ?? null;

    if (pro) {
      importedReviews = (await sql`
        SELECT * FROM reviews_imported
        WHERE professional_id = ${pro.id}
        ORDER BY created_at DESC
        LIMIT 20
      `) as ReviewImported[];
    }
  } catch (err) {
    console.error("[profissional] db failed", err);
    dbDown = true;
  }

  if (!pro) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {dbDown ? "Temporariamente indisponível" : "Profissional não encontrado"}
        </h1>
        {dbDown && (
          <p className="text-sm text-gray-500 mt-2">
            Estamos com instabilidade. Tente novamente em instantes.
          </p>
        )}
        <Link href="/" className="text-blue-600 mt-4 inline-block">Voltar ao início</Link>
      </div>
    );
  }

  const proUrl = `https://chamei.app/profissional/${pro.slug}`;
  const hasReviews = !!pro.google_rating && (pro.google_review_count ?? 0) > 0;
  const business = {
    "@type": "LocalBusiness",
    "@id": proUrl,
    name: pro.name,
    url: proUrl,
    ...(pro.profile_photo_url && { image: pro.profile_photo_url }),
    ...(pro.phone && { telephone: pro.phone }),
    ...(pro.category_name && { serviceType: pro.category_name }),
    ...((pro.address || pro.city) && {
      address: {
        "@type": "PostalAddress",
        ...(pro.address && { streetAddress: pro.address }),
        ...(pro.city && { addressLocality: pro.city }),
        ...(pro.state && { addressRegion: pro.state }),
        addressCountry: "BR",
      },
    }),
    // Only emit aggregateRating with a real reviewCount (Google flags reviewCount: 0).
    ...(hasReviews && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: pro.google_rating,
        reviewCount: pro.google_review_count,
        bestRating: 5,
      },
    }),
    ...(pro.latitude && pro.longitude && {
      geo: { "@type": "GeoCoordinates", latitude: pro.latitude, longitude: pro.longitude },
    }),
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://chamei.app" },
      ...(pro.category_name
        ? [{ "@type": "ListItem", position: 2, name: pro.category_name, item: `https://chamei.app/categoria/${pro.category_slug}` }]
        : []),
      { "@type": "ListItem", position: pro.category_name ? 3 : 2, name: pro.name, item: proUrl },
    ],
  };
  const jsonLd = { "@context": "https://schema.org", "@graph": [business, breadcrumb] };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileViewTracker professionalId={pro.id} />
      <MobileContactBar phone={pro.phone} professionalId={pro.id} professionalName={pro.name} />
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Início</Link>
        <span className="mx-2">/</span>
        <Link href={`/categoria/${pro.category_slug}`} className="hover:text-gray-700">
          {pro.category_name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{pro.name}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{pro.name}</h1>
                  <TierBadge tier={pro.tier} />
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-gray-500">{pro.category_name}</p>
                  <ShareProfileButton />
                </div>
              </div>
            </div>

            {/* Rating */}
            {pro.google_rating && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={pro.google_rating} size="lg" />
                <span className="text-lg font-semibold text-gray-900">{pro.google_rating}</span>
                <span className="text-gray-500">({pro.google_review_count} avaliações no Google)</span>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 text-sm">
              {pro.address && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 w-5">📍</span>
                  <span className="text-gray-700">{pro.address}</span>
                </div>
              )}
              {pro.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-5">📞</span>
                  <TrackedPhoneLink
                    phone={pro.phone}
                    professionalId={pro.id}
                    className="text-blue-600 hover:underline"
                  />
                </div>
              )}
              {pro.website && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-5">🌐</span>
                  <span className="text-gray-700">{pro.website}</span>
                </div>
              )}
              {pro.hours && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-5">🕐</span>
                  <span className="text-gray-700">{pro.hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Avaliações ({importedReviews.length})
            </h2>

            {importedReviews.length > 0 ? (
              <div className="space-y-4">
                {importedReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {review.author_name || "Anônimo"}
                      </span>
                      {review.rating && <StarRating rating={review.rating} />}
                      {review.review_date && (
                        <span className="text-xs text-gray-400">{review.review_date}</span>
                      )}
                    </div>
                    {review.text && (
                      <p className="text-sm text-gray-600">{review.text}</p>
                    )}
                    <span className="text-xs text-gray-300 mt-1 inline-block">via Google</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma avaliação importada ainda.</p>
            )}
          </div>
        </div>

        {/* Sidebar — Contact CTA */}
        <div>
          <ContactSidebar
            phone={pro.phone}
            professionalId={pro.id}
            professionalName={pro.name}
            professionalLat={pro.latitude}
            professionalLng={pro.longitude}
            isClaimed={pro.is_claimed}
          />
        </div>
      </div>
    </div>
    </>
  );
}
