import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Para Profissionais | Chamei - Receba Clientes pelo WhatsApp",
  description:
    "Cadastre-se no Chamei e receba clientes direto no seu WhatsApp. Eletricistas, encanadores, pedreiros, pintores, diaristas e mais. Sem mensalidade, sem taxa.",
};

export default function ParaProfissionais() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
            100% gratuito
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Receba clientes pelo WhatsApp
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            O Chamei conecta você a clientes no Brasil que precisam do seu serviço.
            Eles enviam mensagem direto no seu WhatsApp. Sem intermediário, sem taxa.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Categories available */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Profissionais que aceitamos
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider text-xs">
                Reformas e Reparos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Eletricista", "Encanador", "Pedreiro", "Pintor",
                  "Ar Condicionado", "Serralheiro", "Marceneiro",
                  "Vidraceiro", "Desentupidora", "Marido de Aluguel",
                  "Gesseiro", "Impermeabilização",
                ].map((s) => (
                  <span key={s} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider text-xs">
                Doméstico e Família
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Diarista", "Babá", "Cuidador de Idosos", "Jardineiro",
                  "Limpeza Pós-Obra", "Montador de Móveis",
                  "Mudanças e Carretos", "Tapeceiro",
                ].map((s) => (
                  <span key={s} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "💰",
                title: "Zero custo",
                desc: "Sem mensalidade, sem taxa por lead. Diferente do GetNinjas, você não paga pra receber contato.",
              },
              {
                icon: "📱",
                title: "Direto no WhatsApp",
                desc: "O cliente encontra seu perfil e envia mensagem no seu WhatsApp. Sem app, sem painel.",
              },
              {
                icon: "⭐",
                title: "Comece com reputação",
                desc: "Importamos suas avaliações do Google. Você já aparece com histórico e credibilidade.",
              },
            ].map((b) => (
              <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="text-2xl mb-2">{b.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Como funciona</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Cadastre-se",
                desc: "Preencha seus dados abaixo. Se você tem perfil no Google Maps, nós encontramos automaticamente.",
              },
              {
                step: "2",
                title: "Melhore seu perfil",
                desc: "Adicione WhatsApp, especialidades, fotos de trabalho e descrição. Perfil completo = mais clientes.",
              },
              {
                step: "3",
                title: "Receba clientes",
                desc: "Seu perfil aparece para quem busca seu serviço em SP. O cliente manda WhatsApp e você fecha.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chamei vs GetNinjas</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="p-4 text-left text-gray-400 font-normal text-xs"></th>
                  <th className="p-4 text-center font-semibold text-blue-600 text-xs">Chamei</th>
                  <th className="p-4 text-center font-normal text-gray-400 text-xs">GetNinjas</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["Custo", "Grátis", "Pago por lead"],
                  ["Contato", "WhatsApp direto", "Pelo app deles"],
                  ["Concorrência", "Cliente te escolhe", "5+ disputando"],
                  ["Avaliações", "Importadas do Google", "Começa do zero"],
                  ["Controle", "Total sobre perfil", "Limitado"],
                ].map(([label, chamei, getninjas]) => (
                  <tr key={label} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 text-gray-600">{label}</td>
                    <td className="p-4 text-center text-green-600 font-medium">{chamei}</td>
                    <td className="p-4 text-center text-gray-400">{getninjas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signup Form */}
        <section id="cadastro" className="mb-12">
          <SignupForm />
        </section>
      </div>
    </div>
  );
}
