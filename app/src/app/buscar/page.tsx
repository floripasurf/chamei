import { Suspense } from "react";
import SearchClient from "./search-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar profissionais | Chamei",
};

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
