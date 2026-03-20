"use client";

import { useState, useEffect } from "react";
import ClaimProfile from "./claim-profile";

const PLATFORM_NAME = "Chamei";

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m de você`;
  return `${km.toFixed(1)}km de você`;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ContactSidebar({
  phone,
  professionalId,
  professionalName,
  professionalLat,
  professionalLng,
  isClaimed,
}: {
  phone: string | null;
  professionalId: string;
  professionalName: string;
  professionalLat: number | null;
  professionalLng: number | null;
  isClaimed: boolean;
}) {
  const defaultMessage = `Olá ${professionalName}, encontrei seu perfil no ${PLATFORM_NAME} e gostaria de um orçamento.`;
  const [message, setMessage] = useState(defaultMessage);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!professionalLat || !professionalLng || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const d = haversineDistance(
          position.coords.latitude,
          position.coords.longitude,
          professionalLat,
          professionalLng
        );
        setDistance(d);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [professionalLat, professionalLng]);

  const whatsappUrl = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
      <h3 className="font-semibold text-gray-900 mb-4">Entrar em contato</h3>

      {distance !== null && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
          <span>📍</span>
          <span className="text-sm font-medium text-blue-700">
            {formatDistance(distance)}
          </span>
        </div>
      )}

      {phone && (
        <>
          <label className="block text-sm text-gray-600 mb-2">
            Sua mensagem:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3 resize-none"
          />

          <a
            href={whatsappUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'whatsapp_click', {
                  professional_name: professionalName,
                });
              }
            }}
            className="block w-full text-center bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 transition-colors mb-3"
          >
            Enviar WhatsApp
          </a>

          <a
            href={`tel:${phone}`}
            className="block w-full text-center bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors mb-3"
          >
            Ligar
          </a>
        </>
      )}

      {!phone && (
        <p className="text-sm text-gray-500">
          Telefone não disponível para este profissional.
        </p>
      )}

      {!isClaimed && phone && (
        <ClaimProfile
          professionalId={professionalId}
          professionalName={professionalName}
          phoneLast4Hint={`****${phone.replace(/\D/g, "").slice(-4)}`}
        />
      )}
    </div>
  );
}
