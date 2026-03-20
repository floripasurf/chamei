"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  "Reformas e Reparos": [
    "eletricista", "encanador", "pedreiro", "pintor", "ar-condicionado",
    "serralheiro", "marceneiro", "vidraceiro", "desentupidora",
    "marido-de-aluguel", "gesseiro", "impermeabilizacao",
  ],
  "Doméstico e Família": [
    "diarista", "baba", "cuidador-de-idosos", "jardineiro", "limpeza-pos-obra",
  ],
  "Outros": [
    "montador-de-moveis", "mudancas-e-carretos", "tapeceiro",
  ],
};

export default function SignupForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    category_id: "",
    neighborhood: "",
    description: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  function groupCategories() {
    const grouped: Record<string, Category[]> = {};
    for (const [group, slugs] of Object.entries(CATEGORY_GROUPS)) {
      grouped[group] = slugs
        .map((slug) => categories.find((c) => c.slug === slug))
        .filter(Boolean) as Category[];
    }
    return grouped;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.whatsapp || !form.category_id) {
      setErrorMsg("Preencha nome, WhatsApp e categoria.");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erro ao enviar. Tente novamente.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-600 rounded-2xl p-8 text-center text-white">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">Cadastro recebido!</h2>
        <p className="text-green-100 max-w-md mx-auto">
          Obrigado, {form.name}. Vamos verificar seu perfil e entrar em contato
          pelo WhatsApp em até 24 horas.
        </p>
      </div>
    );
  }

  const grouped = groupCategories();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-10">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Cadastre-se agora
        </h2>
        <p className="text-blue-100 mb-8 text-center text-sm">
          Preencha seus dados e comece a receber clientes pelo WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-blue-200 mb-1">
              Nome ou empresa *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: João Eletricista"
              className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-medium text-blue-200 mb-1">
              WhatsApp *
            </label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-blue-200 mb-1">
              Qual serviço você oferece? *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            >
              <option value="">Selecione sua área</option>
              {Object.entries(grouped).map(([group, cats]) =>
                cats.length > 0 ? (
                  <optgroup key={group} label={group}>
                    {cats.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-xs font-medium text-blue-200 mb-1">
              Bairro ou região que atende
            </label>
            <input
              type="text"
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              placeholder="Ex: Zona Sul, Moema, toda SP"
              className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-blue-200 mb-1">
              Fale um pouco sobre seu trabalho
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: 10 anos de experiência, atendo residencial e comercial..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-sm resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-red-200 text-sm text-center bg-red-500/20 rounded-lg p-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-white text-blue-600 px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? "Enviando..." : "Quero receber clientes"}
          </button>
        </form>

        <p className="text-xs text-blue-200/70 mt-4 text-center">
          Sem compromisso. Sem mensalidade. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
