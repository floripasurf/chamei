"use client";

import { useState } from "react";

interface ProfileData {
  name: string;
  whatsapp: string;
  description: string;
  neighborhood: string;
  hours: string;
  years_experience: number;
}

export default function ProfileEdit({
  professionalId,
  initialData,
}: {
  professionalId: string;
  initialData: ProfileData;
}) {
  const [data, setData] = useState<ProfileData>(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChange(field: keyof ProfileData, value: string | number) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/meu-perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: professionalId,
          ...data,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erro ao salvar. Tente novamente." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Empresa</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Seu nome ou nome da empresa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <input
          type="tel"
          value={data.whatsapp}
          onChange={(e) => handleChange("whatsapp", e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
          <span className="text-gray-400 font-normal ml-1">({data.description.length}/500)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Descreva seus serviços, experiência, diferenciais..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Área de atendimento</label>
        <input
          type="text"
          value={data.neighborhood}
          onChange={(e) => handleChange("neighborhood", e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Zona Sul, Moema, toda SP"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de atendimento</label>
          <input
            type="text"
            value={data.hours}
            onChange={(e) => handleChange("hours", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Seg-Sex 8h-18h"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anos de experiência</label>
          <input
            type="number"
            min={0}
            max={50}
            value={data.years_experience || ""}
            onChange={(e) => handleChange("years_experience", parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 5"
          />
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
