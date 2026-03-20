"use client";

import { useState, useEffect, useRef } from "react";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

export default function PhotoUpload({ professionalId }: { professionalId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const res = await fetch("/api/meu-perfil/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch {
      // Silently fail on load
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Apenas imagens são permitidas." });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "A imagem deve ter no máximo 5MB." });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("professional_id", professionalId);

      const res = await fetch("/api/meu-perfil/photos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Foto enviada com sucesso!" });
        await loadPhotos();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erro ao enviar foto." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm("Tem certeza que deseja remover esta foto?")) return;

    try {
      const res = await fetch(`/api/meu-perfil/photos?id=${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setMessage({ type: "success", text: "Foto removida." });
      } else {
        setMessage({ type: "error", text: "Erro ao remover foto." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão." });
    }
  }

  return (
    <div>
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={photo.url}
                alt={photo.caption || "Foto do trabalho"}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Remover foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">
          Nenhuma foto adicionada. Adicione fotos dos seus trabalhos para atrair mais clientes.
        </p>
      )}

      {message && (
        <div
          className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <label
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
          uploading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        {uploading ? "Enviando..." : "Adicionar foto"}
      </label>
    </div>
  );
}
