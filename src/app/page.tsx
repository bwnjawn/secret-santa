import { CreateEventForm } from "@/components/CreateEventForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-900">
          <span>🎁 Sorteo privado · Cero spoilers</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Amigo Secreto Familiar
        </h1>
        <p className="mx-auto max-w-lg text-sm text-stone-600 sm:text-base">
          Crea el sorteo, copia los enlaces para WhatsApp y protege el secreto incluso
          cuando alguien ayude a tu abuela a abrir su invitación.
        </p>
      </header>

      <CreateEventForm />
    </div>
  );
}
