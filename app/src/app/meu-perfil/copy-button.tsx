"use client";

import { useState } from "react";

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        copied
          ? "bg-green-600 text-white"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
