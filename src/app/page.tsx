import Link from "next/link";
import { Eye, ShieldCheck } from "lucide-react";
import { CreateEventForm } from "@/components/CreateEventForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3 rounded-3xl border border-stone-200 bg-white/95 p-5 text-center shadow-xl backdrop-blur-sm sm:p-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-900">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
          <span>Sorteo privado · Cero spoilers</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Amigo Secreto Familiar
        </h1>

        <p className="mx-auto max-w-lg text-sm text-stone-600 sm:text-base">
          Crea el sorteo, copia los enlaces para WhatsApp y protege el secreto incluso
          cuando alguien ayude a tu abuela a abrir su invitación.
        </p>

        <div className="pt-1">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 transition hover:bg-stone-100 sm:text-sm"
          >
            <Eye className="h-4 w-4 text-emerald-700" />
            <span>Ver ejemplo de cómo lo ven los participantes</span>
          </Link>
        </div>
      </header>

      <CreateEventForm />
    </div>
  );
}
