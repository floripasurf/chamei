import { redirect } from "next/navigation";
import { getSessionProfessional } from "@/lib/auth";
import { Professional } from "@/lib/types";
import ProfileEdit from "./profile-edit";
import PhotoUpload from "./photo-upload";
import CopyButton from "./copy-button";
import DashboardStats from "./dashboard-stats";

export const metadata = {
  title: "Meu Perfil | Chamei",
};

export default async function MeuPerfilPage() {
  const pro = await getSessionProfessional() as (Professional & { category_name: string; category_slug: string }) | null;

  if (!pro) {
    redirect("/");
  }

  const profileUrl = `https://chamei.app/profissional/${pro.slug}`;

  // Calculate profile completeness
  const fields = [
    pro.name,
    pro.whatsapp || pro.phone,
    pro.description,
    pro.neighborhood,
    pro.hours,
    pro.photo_url || pro.profile_photo_url,
  ];
  const filledCount = fields.filter(Boolean).length;
  const profileComplete = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-display">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie suas informações e receba mais clientes
        </p>
      </div>

      {/* Stats Section */}
      <DashboardStats profileComplete={profileComplete} professionalName={pro.name} />

      {/* Profile Edit */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-gray-400">✏️</span> Informações do perfil
        </h2>
        <ProfileEdit
          professionalId={pro.id}
          initialData={{
            name: pro.name || "",
            whatsapp: pro.whatsapp || pro.phone || "",
            description: pro.description || "",
            neighborhood: pro.neighborhood || "",
            hours: pro.hours || "",
            years_experience: 0,
          }}
        />
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-gray-400">📷</span> Fotos do trabalho
        </h2>
        <PhotoUpload professionalId={pro.id} />
      </div>

      {/* Share Link */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-gray-400">🔗</span> Compartilhar perfil
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Compartilhe seu perfil com clientes para receber mais avaliações e contatos.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={profileUrl}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-gray-50"
          />
          <CopyButton url={profileUrl} />
        </div>
      </div>
    </div>
  );
}

