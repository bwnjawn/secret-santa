"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Coins, EyeOff, Gift, Lock } from "lucide-react";
import type { ParticipantWelcomeInfo } from "@/lib/event-service";

interface RevealCardProps {
  token: string;
  initialInfo: ParticipantWelcomeInfo;
}

interface RevealedData {
  participantName: string;
  targetName: string;
  isAssisted: boolean;
  eventTitle: string;
  eventDate: string | null;
  budget: string | null;
}

type ViewStep = "welcome" | "revealed" | "hidden" | "exhausted";

export function RevealCard({ token, initialInfo }: RevealCardProps) {
  const [step, setStep] = useState<ViewStep>(
    initialInfo.canReveal ? "welcome" : "exhausted"
  );
  const [revealed, setRevealed] = useState<RevealedData | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(
    initialInfo.organizerName
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssisted = initialInfo.isAssisted;

  async function handleReveal() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/reveal/${token}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setOrganizerName(data.organizerName ?? initialInfo.organizerName);
          setStep("exhausted");
          return;
        }
        setError(data.error || "No se pudo consultar el resultado.");
        return;
      }

      setRevealed(data);
      setStep("revealed");
    } catch {
      setError("Error de conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleHide() {
    setRevealed(null);
    setStep("hidden");
  }

  if (step === "hidden") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" />
        <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
          ¡Listo, resultado oculto!
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Ya puedes cerrar esta página o devolver el teléfono con tranquilidad.
        </p>
      </div>
    );
  }

  if (step === "exhausted") {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <Lock className="mx-auto h-12 w-12 text-stone-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
          Este resultado ya fue revelado
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Por privacidad, este enlace funciona una sola vez para que nadie más pueda
          volver a abrirlo.
        </p>
        <p className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm font-medium text-stone-700">
          Si lo cerraste por error o lo olvidaste, pídele a{" "}
          <strong>{organizerName || "quien organizó el sorteo"}</strong> que habilite una
          vista más desde su panel.
        </p>
      </div>
    );
  }

  if (step === "revealed" && revealed) {
    return (
      <div className="space-y-6 rounded-3xl border-2 border-emerald-800 bg-white p-6 text-center shadow-lg sm:p-9">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-emerald-800 uppercase">
            {revealed.eventTitle}
          </p>
          <p
            className={
              isAssisted
                ? "text-xl font-bold text-stone-700"
                : "text-base font-medium text-stone-600"
            }
          >
            {revealed.participantName}, te tocó regalarle a:
          </p>
        </div>

        <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 px-4 py-8">
          <p
            className={
              isAssisted
                ? "text-5xl font-black tracking-tight text-emerald-950 break-words sm:text-6xl"
                : "text-4xl font-black tracking-tight text-emerald-950 break-words sm:text-5xl"
            }
          >
            {revealed.targetName}
          </p>
        </div>

        {(revealed.eventDate || revealed.budget) && (
          <div className="flex flex-col gap-2.5 text-left sm:flex-row sm:justify-center">
            {revealed.eventDate && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-base font-semibold text-stone-800">
                <Calendar className="h-5 w-5 text-emerald-700" />
                <span>Fecha: {revealed.eventDate}</span>
              </div>
            )}
            {revealed.budget && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-base font-semibold text-stone-800">
                <Coins className="h-5 w-5 text-emerald-700" />
                <span>Presupuesto: {revealed.budget}</span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleHide}
          className={
            isAssisted
              ? "inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-950 px-6 py-6 text-2xl font-black text-white shadow-md transition active:scale-[0.99] hover:bg-stone-800"
              : "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-stone-800"
          }
        >
          <EyeOff className={isAssisted ? "h-7 w-7" : "h-5 w-5"} />
          LISTO, OCULTAR RESULTADO
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-9">
      {isAssisted && (
        <div className="rounded-2xl border-2 border-amber-500 bg-amber-100 p-4 text-left text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <p className="text-base font-black uppercase tracking-wide">
                Si estás ayudando, DETENTE aquí
              </p>
              <p className="text-sm font-semibold leading-relaxed sm:text-base">
                No presiones el botón verde. Pásale el teléfono a{" "}
                <strong className="underline">{initialInfo.participantName}</strong> para que
                lo toque y mire a solas.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Gift className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
          {initialInfo.eventTitle}
        </p>
        <h1
          className={
            isAssisted
              ? "text-3xl font-black text-stone-900 sm:text-4xl"
              : "text-2xl font-extrabold text-stone-900 sm:text-3xl"
          }
        >
          Hola, {initialInfo.participantName}
        </h1>
        <p className={isAssisted ? "text-lg text-stone-700" : "text-sm text-stone-600"}>
          {isAssisted
            ? "Cuando estés mirando sola la pantalla, toca el botón gigante de abajo."
            : "Asegúrate de que nadie más esté mirando tu pantalla. Este enlace es de un solo uso."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={isLoading}
        onClick={handleReveal}
        className={
          isAssisted
            ? "w-full rounded-2xl bg-emerald-800 px-6 py-7 text-2xl font-black text-white shadow-lg transition active:scale-[0.99] hover:bg-emerald-900 disabled:opacity-60"
            : "w-full rounded-2xl bg-emerald-800 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-emerald-900 disabled:opacity-60"
        }
      >
        {isLoading
          ? "Abriendo..."
          : isAssisted
            ? "VER A QUIÉN ME TOCÓ"
            : "Revelar mi Amigo Secreto 🎁"}
      </button>
    </div>
  );
}
