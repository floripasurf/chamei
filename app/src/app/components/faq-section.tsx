import type { FaqItem } from "@/lib/seo-content";

// Visible FAQ (accordion). Pairs with FAQPage JSON-LD for rich results and adds
// unique, useful text to otherwise thin local pages.
export default function FaqSection({ items, title = "Perguntas frequentes" }: { items: FaqItem[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-2">
        {items.map((f, i) => (
          <details key={i} className="bg-white rounded-xl border border-gray-100">
            <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer text-sm hover:text-blue-600 transition-colors">
              {f.q}
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
