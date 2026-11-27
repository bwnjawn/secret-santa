import type { Metadata } from "next";
import { getDb } from "@/db";
import { getParticipantWelcomeInfo } from "@/lib/event-service";
import { RevealCard } from "@/components/RevealCard";

export const dynamic = "force-dynamic";

// Metadata generica para que WhatsApp nunca filtre datos ni consuma el enlace
export const metadata: Metadata = {
  title: "Invitación de Amigo Secreto 🎁",
  description: "Abre tu enlace privado para descubrir a quién te tocó regalar.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Invitación de Amigo Secreto 🎁",
    description: "Abre tu enlace privado para descubrir a quién te tocó regalar.",
  },
};

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getParticipantWelcomeInfo(getDb(), token);

  if (!info) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">Enlace inválido</h1>
        <p className="mt-2 text-sm text-stone-600">
          Este enlace no existe o ya no está disponible. Pídele a quien organizó el
          sorteo que revise tu invitación.
        </p>
      </div>
    );
  }

  return <RevealCard token={token} initialInfo={info} />;
}
