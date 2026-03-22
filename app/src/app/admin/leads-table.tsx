"use client";

import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  category_id: string | null;
  category_name: string | null;
  neighborhood: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-green-100 text-green-700",
  contacted: "bg-blue-100 text-blue-700",
  claimed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  contacted: "Contactado",
  claimed: "Reivindicado",
  rejected: "Rejeitado",
};

export default function LeadsTable({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [updating, setUpdating] = useState<string | null>(null);
  const [approvedUrl, setApprovedUrl] = useState<string | null>(null);

  async function approveLead(id: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/leads/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "claimed" } : l))
        );
        setApprovedUrl(data.professional.url);
        setTimeout(() => setApprovedUrl(null), 5000);
      }
    } catch {
      // ignore
    }
    setUpdating(null);
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
      }
    } catch {
      // ignore
    }
    setUpdating(null);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatWhatsapp(num: string) {
    if (num.length === 11) {
      return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
    }
    return num;
  }

  if (leads.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        Nenhum lead ainda. Quando profissionais se cadastrarem, aparecem aqui.
      </p>
    );
  }

  return (
    <div>
      {approvedUrl && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-green-700">
            Perfil criado com sucesso!
          </span>
          <a
            href={approvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Ver perfil →
          </a>
        </div>
      )}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 text-xs font-medium text-gray-400">Nome</th>
            <th className="pb-3 text-xs font-medium text-gray-400">WhatsApp</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Categoria</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Bairro</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Status</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Data</th>
            <th className="pb-3 text-xs font-medium text-gray-400">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 pr-3">
                <span className="font-medium text-gray-900">{lead.name}</span>
                {lead.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                    {lead.description}
                  </p>
                )}
              </td>
              <td className="py-3 pr-3">
                <a
                  href={`https://wa.me/55${lead.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline font-mono text-xs"
                >
                  {formatWhatsapp(lead.whatsapp)}
                </a>
              </td>
              <td className="py-3 pr-3 text-gray-600">
                {lead.category_name || "—"}
              </td>
              <td className="py-3 pr-3 text-gray-500 text-xs">
                {lead.neighborhood || "—"}
              </td>
              <td className="py-3 pr-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}
                >
                  {STATUS_LABELS[lead.status] || lead.status}
                </span>
              </td>
              <td className="py-3 pr-3 text-xs text-gray-400">
                {formatDate(lead.created_at)}
              </td>
              <td className="py-3">
                <div className="flex gap-1">
                  {lead.status !== "claimed" && lead.status !== "rejected" && (
                    <button
                      onClick={() => approveLead(lead.id)}
                      disabled={updating === lead.id}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {updating === lead.id ? "..." : "Aprovar"}
                    </button>
                  )}
                  {lead.status === "new" && (
                    <a
                      href={`https://wa.me/55${lead.whatsapp}?text=${encodeURIComponent(`Ola ${lead.name}, aqui e da equipe Chamei! Recebemos seu cadastro como ${lead.category_name || "profissional"} e queremos te ajudar a receber mais clientes. Podemos conversar?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                  {lead.status !== "rejected" && lead.status !== "claimed" && (
                    <button
                      onClick={() => updateStatus(lead.id, "rejected")}
                      disabled={updating === lead.id}
                      className="text-xs px-2 py-1 text-gray-400 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
