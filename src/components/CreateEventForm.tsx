"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, ShieldAlert, Trash2, UserCheck, Users } from "lucide-react";

interface ParticipantRow {
  clientId: string;
  name: string;
  isAssisted: boolean;
}

interface ExclusionRow {
  id: string;
  giverClientId: string;
  excludedClientId: string;
  mutual: boolean;
}

function makeClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CreateEventForm() {
  const router = useRouter();

  const [title, setTitle] = useState("Amigo Secreto Familiar");
  const [organizerName, setOrganizerName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [budget, setBudget] = useState("");

  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { clientId: "p-1", name: "", isAssisted: false },
    { clientId: "p-2", name: "", isAssisted: false },
    { clientId: "p-3", name: "", isAssisted: false },
  ]);

  const [exclusions, setExclusions] = useState<ExclusionRow[]>([]);
  const [giverId, setGiverId] = useState("");
  const [excludedId, setExcludedId] = useState("");
  const [mutual, setMutual] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const namedParticipants = participants.filter((p) => p.name.trim().length > 0);

  function addParticipant() {
    setParticipants((prev) => [
      ...prev,
      { clientId: makeClientId(), name: "", isAssisted: false },
    ]);
  }

  function updateParticipant(clientId: string, patch: Partial<ParticipantRow>) {
    setParticipants((prev) =>
      prev.map((p) => (p.clientId === clientId ? { ...p, ...patch } : p))
    );
  }

  function removeParticipant(clientId: string) {
    setParticipants((prev) => prev.filter((p) => p.clientId !== clientId));
    setExclusions((prev) =>
      prev.filter(
        (ex) => ex.giverClientId !== clientId && ex.excludedClientId !== clientId
      )
    );
    if (giverId === clientId) setGiverId("");
    if (excludedId === clientId) setExcludedId("");
  }

  function addExclusion() {
    if (!giverId || !excludedId || giverId === excludedId) return;

    const alreadyExists = exclusions.some(
      (ex) =>
        (ex.giverClientId === giverId && ex.excludedClientId === excludedId) ||
        (ex.mutual &&
          ex.giverClientId === excludedId &&
          ex.excludedClientId === giverId)
    );
    if (alreadyExists) return;

    setExclusions((prev) => [
      ...prev,
      {
        id: makeClientId(),
        giverClientId: giverId,
        excludedClientId: excludedId,
        mutual,
      },
    ]);
    setGiverId("");
    setExcludedId("");
  }

  function removeExclusion(id: string) {
    setExclusions((prev) => prev.filter((ex) => ex.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanedParticipants = participants
      .map((p) => ({ ...p, name: p.name.trim() }))
      .filter((p) => p.name.length > 0);

    if (!title.trim()) {
      setErrorMessage("Escribe un nombre para el evento.");
      return;
    }

    if (cleanedParticipants.length < 3) {
      setErrorMessage("Necesitas al menos 3 participantes con nombre.");
      return;
    }

    setIsSubmitting(true);
    try {
      const validIds = new Set(cleanedParticipants.map((p) => p.clientId));
      const payload = {
        title: title.trim(),
        organizerName: organizerName.trim() || null,
        eventDate: eventDate.trim() || null,
        budget: budget.trim() || null,
        participants: cleanedParticipants,
        exclusions: exclusions
          .filter(
            (ex) =>
              validIds.has(ex.giverClientId) && validIds.has(ex.excludedClientId)
          )
          .map((ex) => ({
            giverClientId: ex.giverClientId,
            excludedClientId: ex.excludedClientId,
            mutual: ex.mutual,
          })),
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "No se pudo crear el sorteo.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/admin/${data.adminToken}`);
    } catch {
      setErrorMessage("Error de conexión al crear el sorteo. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  }

  function getNameByClientId(id: string): string {
    return participants.find((p) => p.clientId === id)?.name.trim() || "Participante";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-900">
          <Gift className="h-5 w-5 text-red-700" />
          <h2 className="text-lg font-bold">1. Datos del intercambio</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="event-title"
              className="mb-1 block text-sm font-semibold text-stone-700"
            >
              Nombre del evento *
            </label>
            <input
              id="event-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Navidad Familia 2026"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label
              htmlFor="organizer-name"
              className="mb-1 block text-sm font-semibold text-stone-700"
            >
              Tu nombre como organizador{" "}
              <span className="font-normal text-stone-500">(opcional)</span>
            </label>
            <input
              id="organizer-name"
              type="text"
              maxLength={60}
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Ej: Benja (se muestra si alguien necesita reactivar su link)"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-date"
                className="mb-1 block text-sm font-semibold text-stone-700"
              >
                Fecha{" "}
                <span className="font-normal text-stone-500">(opcional)</span>
              </label>
              <input
                id="event-date"
                type="text"
                maxLength={60}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="Ej: 24 de diciembre"
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label
                htmlFor="event-budget"
                className="mb-1 block text-sm font-semibold text-stone-700"
              >
                Presupuesto{" "}
                <span className="font-normal text-stone-500">(opcional)</span>
              </label>
              <input
                id="event-budget"
                type="text"
                maxLength={60}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ej: $15.000 aprox."
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Si dejas Fecha o Presupuesto vacíos, no aparecerán en las tarjetas de resultado.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-900">
            <Users className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold">2. Participantes</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
            Mínimo 3
          </span>
        </div>

        <p className="mb-4 text-sm text-stone-600">
          Inclúyete a ti mismo en la lista si también participas. Activa{" "}
          <strong>Modo asistido</strong> para tu abuela o quien necesite ayuda abriendo el
          enlace (muestra aviso previo, letra gigante y botón para ocultar).
        </p>

        <div className="space-y-3">
          {participants.map((p, index) => (
            <div
              key={p.clientId}
              className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-3 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                maxLength={60}
                value={p.name}
                onChange={(e) =>
                  updateParticipant(p.clientId, { name: e.target.value })
                }
                placeholder={`Participante ${index + 1} (ej: ${
                  index === 0 ? "Tu nombre" : index === 1 ? "Abuela" : "Familiar"
                })`}
                className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
              />

              <div className="flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 select-none hover:bg-stone-50">
                  <input
                    type="checkbox"
                    checked={p.isAssisted}
                    onChange={(e) =>
                      updateParticipant(p.clientId, { isAssisted: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                  <span>Modo asistido</span>
                </label>

                {participants.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.clientId)}
                    aria-label="Eliminar participante"
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addParticipant}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-700/40 bg-emerald-50/60 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100/70"
        >
          <Plus className="h-4 w-4" />
          Agregar otro participante
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-emerald-900">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-bold">
            3. Exclusiones <span className="text-sm font-normal text-stone-500">(opcional)</span>
          </h2>
        </div>
        <p className="mb-4 text-sm text-stone-600">
          Úsalo si quieres evitar que dos personas se regalen entre sí (por ejemplo, parejas).
        </p>

        {namedParticipants.length < 2 ? (
          <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            Escribe al menos 2 nombres arriba para configurar exclusiones.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={giverId}
                onChange={(e) => setGiverId(e.target.value)}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700"
              >
                <option value="">Persona 1...</option>
                {namedParticipants.map((p) => (
                  <option key={p.clientId} value={p.clientId}>
                    {p.name.trim()}
                  </option>
                ))}
              </select>

              <select
                value={excludedId}
                onChange={(e) => setExcludedId(e.target.value)}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-700"
              >
                <option value="">No puede tocar a...</option>
                {namedParticipants
                  .filter((p) => p.clientId !== giverId)
                  .map((p) => (
                    <option key={p.clientId} value={p.clientId}>
                      {p.name.trim()}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={mutual}
                  onChange={(e) => setMutual(e.target.checked)}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span>Mutuo (ninguno puede tocar al otro)</span>
              </label>

              <button
                type="button"
                onClick={addExclusion}
                disabled={!giverId || !excludedId || giverId === excludedId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar regla
              </button>
            </div>

            {exclusions.length > 0 && (
              <ul className="mt-2 space-y-2">
                {exclusions.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-stone-800"
                  >
                    <span>
                      <strong>{getNameByClientId(ex.giverClientId)}</strong>{" "}
                      {ex.mutual ? "↔ no se toca con ↔" : "→ no regala a →"}{" "}
                      <strong>{getNameByClientId(ex.excludedClientId)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExclusion(ex.id)}
                      aria-label="Quitar exclusión"
                      className="rounded-lg p-1 text-stone-500 hover:bg-amber-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-emerald-800 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Realizando sorteo..." : "Sortear y generar enlaces 🎁"}
      </button>
    </form>
  );
}
