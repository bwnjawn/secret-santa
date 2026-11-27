"use client";

import { useState } from "react";
import {
  BookmarkCheck,
  Calendar,
  Check,
  Coins,
  Copy,
  EyeOff,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/event-service";

interface AdminDashboardProps {
  adminToken: string;
  initialData: AdminDashboardData;
}

export function AdminDashboard({ adminToken, initialData }: AdminDashboardProps) {
  const [participants, setParticipants] = useState(initialData.participants);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const viewedCount = participants.filter((p) => p.remainingViews === 0).length;

  function buildWhatsAppMessage(name: string, token: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/v/${token}`;
    return [
      `¡Hola ${name}! 🎁`,
      `Ya está listo el sorteo de "${initialData.event.title}".`,
      `Entra a este enlace único para descubrir tu amigo secreto (solo tú puedes verlo):`,
      url,
    ].join("\n");
  }

  async function copyWhatsAppInvite(id: string, name: string, token: string) {
    try {
      await navigator.clipboard.writeText(buildWhatsAppMessage(name, token));
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2200);
    } catch {
      setError("No se pudo copiar al portapapeles. Intenta copiar manualmente.");
    }
  }

  async function copyAdminLink() {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}/admin/${adminToken}`);
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2200);
    } catch {
      setError("No se pudo copiar el enlace de administrador.");
    }
  }

  async function handleGrantExtraView(participantId: string) {
    setError(null);
    setGrantingId(participantId);
    try {
      const res = await fetch(`/api/admin/${adminToken}/grant-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo habilitar una vista extra.");
        return;
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, remainingViews: data.participant.remainingViews }
            : p
        )
      );
    } catch {
      setError("Error de red al intentar habilitar otra vista.");
    } finally {
      setGrantingId(null);
    }
  }

  function formatTimestamp(ms: number | null): string {
    if (!ms) return "";
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ms));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <BookmarkCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="text-sm">
              <p className="font-bold">Guarda esta página en tus favoritos</p>
              <p className="text-amber-900/80">
                Es tu panel único para copiar las invitaciones y reactivar links si alguien se
                olvida.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyAdminLink}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-950"
          >
            {copiedAdmin ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedAdmin ? "¡Link guardado!" : "Copiar link del panel"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">
              {initialData.event.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-stone-600">
              {initialData.event.eventDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  {initialData.event.eventDate}
                </span>
              )}
              {initialData.event.budget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
                  <Coins className="h-3.5 w-3.5 text-emerald-700" />
                  {initialData.event.budget}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-xs font-medium text-emerald-800">Progreso</p>
            <p className="text-lg font-extrabold text-emerald-950">
              {viewedCount} / {participants.length} vieron
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
          <EyeOff className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>
            <strong>Cero spoilers:</strong> este panel nunca muestra a quién le tocó a quién.
            Si abres el link de otro familiar, se marcará como visto y esa persona lo notará.
          </span>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-stone-800">
          Invitaciones para enviar por WhatsApp
        </h2>

        {participants.map((p) => {
          const isConsumed = p.remainingViews <= 0;
          const isReactivated = p.remainingViews > 0 && p.viewedAt !== null;

          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-stone-900">{p.name}</span>
                  {p.isAssisted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      <UserCheck className="h-3 w-3" />
                      Modo asistido
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600">
                  {isConsumed ? (
                    <span className="font-semibold text-emerald-800">
                      ✅ Ya lo vio ({formatTimestamp(p.viewedAt)})
                    </span>
                  ) : isReactivated ? (
                    <span className="font-semibold text-amber-700">
                      🔄 Vista extra activa ({p.remainingViews} disponible
                      {p.remainingViews > 1 ? "s" : ""})
                    </span>
                  ) : (
                    <span className="text-stone-500">⏳ Pendiente de abrir</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyWhatsAppInvite(p.id, p.name, p.token)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-900 sm:flex-none"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar mensaje WhatsApp
                    </>
                  )}
                </button>

                {isConsumed && (
                  <button
                    type="button"
                    disabled={grantingId === p.id}
                    onClick={() => handleGrantExtraView(p.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {grantingId === p.id ? "Habilitando..." : "Dar 1 vista más"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
