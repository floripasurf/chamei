"use client";

import { useState } from "react";

interface Claim {
  id: string;
  professional_name: string;
  professional_slug: string;
  professional_phone: string;
  phone_provided: string;
  claim_code: string;
  status: string;
  created_at: string;
}

export default function ClaimsTable({ claims: initialClaims }: { claims: Claim[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: "verified" | "rejected") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/claim/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
      }
    } catch {}
    setUpdating(null);
  }

  if (claims.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Nenhuma reivindicacao ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 text-xs font-medium text-gray-400">Profissional</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Tel. perfil</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Tel. informado</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Codigo</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Status</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Data</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 pr-3">
                <a
                  href={`/profissional/${claim.professional_slug}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {claim.professional_name}
                </a>
              </td>
              <td className="py-3 pr-3 font-mono text-xs text-gray-500">
                {claim.professional_phone}
              </td>
              <td className="py-3 pr-3 font-mono text-xs text-gray-500">
                {claim.phone_provided}
              </td>
              <td className="py-3 pr-3 font-mono text-xs font-bold text-gray-700">
                {claim.claim_code}
              </td>
              <td className="py-3 pr-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    claim.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : claim.status === "verified"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {claim.status === "pending"
                    ? "Pendente"
                    : claim.status === "verified"
                      ? "Verificado"
                      : "Rejeitado"}
                </span>
              </td>
              <td className="py-3 pr-3 text-xs text-gray-400">
                {new Date(claim.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-3">
                {claim.status === "pending" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(claim.id, "verified")}
                      disabled={updating === claim.id}
                      className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => updateStatus(claim.id, "rejected")}
                      disabled={updating === claim.id}
                      className="text-xs px-2 py-1 text-gray-400 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
