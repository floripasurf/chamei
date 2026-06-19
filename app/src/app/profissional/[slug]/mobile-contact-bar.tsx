"use client";

import { trackEvent } from "@/lib/track";

const PLATFORM_NAME = "Chamei";

// Fixed bottom action bar on mobile — keeps the WhatsApp CTA reachable even when
// the contact card is far below the fold (the profile stacks on small screens).
export default function MobileContactBar({
  phone,
  professionalId,
  professionalName,
}: {
  phone: string | null;
  professionalId: string;
  professionalName: string;
}) {
  if (!phone) return null;

  const message = `Olá ${professionalName}, encontrei seu perfil no ${PLATFORM_NAME} e gostaria de um orçamento.`;
  const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={`tel:${phone}`}
        onClick={() =>
          trackEvent({ type: "contact", professional_id: professionalId, channel: "phone", source: "profile" })
        }
        aria-label="Ligar"
        className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-blue-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.52l.7 2.8a2 2 0 01-.5 1.9l-1.2 1.2a14 14 0 006.36 6.36l1.2-1.2a2 2 0 011.9-.5l2.8.7A2 2 0 0121 18.72V21a2 2 0 01-2 2C9.6 23 1 14.4 1 4a2 2 0 012-2z"
          />
        </svg>
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent({ type: "contact", professional_id: professionalId, channel: "whatsapp", source: "profile" })
        }
        className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 font-semibold active:bg-green-700"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Chamar no WhatsApp
      </a>
    </div>
  );
}
