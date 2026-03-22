"use client";

import Link from "next/link";

const PLATFORM_NAME = "Chamei";

interface CardProfessional {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  google_rating: number | null;
  google_review_count: number;
  is_verified: boolean;
  is_claimed?: boolean;
  photo_url: string | null;
  hours: string | null;
  distance_km?: number;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const decimal = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < full ? "text-amber-400" : i === full && decimal >= 0.3 ? "text-amber-300" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    const last4 = digits.slice(-4);
    return `(${ddd}) ${digits.length === 11 ? "9" : ""}****-${last4}`;
  }
  return phone.replace(/.(?=.{4})/g, "*");
}

function TrustSignals({ pro }: { pro: CardProfessional }) {
  const badges: { label: string; color: string }[] = [];

  if (pro.google_rating !== null && pro.google_rating >= 4.8) {
    badges.push({ label: "Top avaliado", color: "text-green-600" });
  } else if (pro.google_review_count >= 20) {
    badges.push({ label: "Muito avaliado", color: "text-green-600" });
  }

  if (pro.hours && (/24/.test(pro.hours) || /aberto/i.test(pro.hours))) {
    badges.push({ label: "Disponível agora", color: "text-blue-600" });
  }

  if (badges.length === 0 && !pro.phone) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
      {badges.map((b) => (
        <span key={b.label} className={`text-xs font-medium ${b.color}`}>
          {b.label}
        </span>
      ))}
      {pro.phone && (
        <span className="text-xs text-gray-400">
          {maskPhone(pro.phone)}
        </span>
      )}
    </div>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ProfessionalCard({
  pro,
  topReview,
}: {
  pro: CardProfessional;
  topReview?: { author_name: string | null; text: string | null; rating: number | null } | null;
}) {
  const whatsappMessage = `Olá ${pro.name}, encontrei seu perfil no ${PLATFORM_NAME} e gostaria de um orçamento.`;
  const whatsappUrl = pro.phone
    ? `https://wa.me/55${pro.phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex">
        {/* Photo */}
        <Link href={`/profissional/${pro.slug}`} className="shrink-0">
          {pro.photo_url ? (
            <img
              src={pro.photo_url}
              alt={pro.name}
              className="w-28 h-full sm:w-36 object-cover bg-gray-100"
              loading="lazy"
            />
          ) : (
            <div className="w-28 h-full sm:w-36 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center min-h-[120px]">
              <span className="text-2xl font-bold text-white/90">
                {getInitials(pro.name)}
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/profissional/${pro.slug}`} className="min-w-0 flex items-center gap-1.5">
                <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {pro.name}
                </h3>
                {pro.is_claimed && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" title="Perfil verificado pelo profissional">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verificado
                  </span>
                )}
              </Link>
              {pro.distance_km !== undefined && (
                <span className="shrink-0 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {formatDistance(pro.distance_km)}
                </span>
              )}
            </div>

            {/* Location */}
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {pro.neighborhood || pro.city || pro.address || "São Paulo, SP"}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              {pro.google_rating ? (
                <>
                  <StarRating rating={pro.google_rating} />
                  <span className="text-sm font-medium text-gray-700">
                    {pro.google_rating}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({pro.google_review_count})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Sem avaliações ainda</span>
              )}
            </div>

            {/* Trust signals */}
            <TrustSignals pro={pro} />

            {/* Top review snippet */}
            {topReview?.text && (
              <p className="text-xs text-gray-400 mt-1.5 truncate">
                {topReview.author_name && (
                  <span className="font-medium text-gray-500">{topReview.author_name}: </span>
                )}
                &ldquo;{topReview.text.length > 80 ? topReview.text.slice(0, 80) + "..." : topReview.text}&rdquo;
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'whatsapp_click', {
                      professional_name: pro.name,
                      professional_id: pro.id,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
            <Link
              href={`/profissional/${pro.slug}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors px-3 py-2"
            >
              Ver perfil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
