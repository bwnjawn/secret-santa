"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Lock, RotateCcw, User, UserCheck } from "lucide-react";
import { RevealCard } from "@/components/RevealCard";

export function DemoPreview() {
  const [mode, setMode] = useState<"assisted" | "normal">("assisted");
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDate, setShowDate] = useState(true);
  const [showBudget, setShowBudget] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const isAssisted = mode === "assisted";

  function handleReset() {
    setIsBlocked(false);
    setResetKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white/95 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-900">
            <Eye className="h-5 w-5 shrink-0" />
            <h1 className="text-lg font-extrabold sm:text-xl">
              Vista previa de ejemplo (sin gastar enlaces)
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio
          </Link>
        </div>

        <p className="mt-2 text-sm text-stone-600">
          Prueba aquí cómo verá su invitación cada familiar sin tocar la base de datos ni
          quemar links reales.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("assisted");
              setIsBlocked(false);
              setResetKey((k) => k + 1);
            }}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
              isAssisted && !isBlocked
                ? "bg-amber-500 text-stone-950 shadow-sm"
                : "border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Modo asistido (Abuela)
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("normal");
              setIsBlocked(false);
              setResetKey((k) => k + 1);
            }}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
              !isAssisted && !isBlocked
                ? "bg-emerald-800 text-white shadow-sm"
                : "border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
            }`}
          >
            <User className="h-4 w-4" />
            Participante normal
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBlocked((prev) => !prev);
              setResetKey((k) => k + 1);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              isBlocked
                ? "bg-stone-900 text-white shadow-sm"
                : "border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
            }`}
          >
            <Lock className="h-4 w-4" />
            Simular enlace ya usado
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-stone-200 pt-3 text-xs font-medium text-stone-700">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={showDate}
              onChange={(e) => {
                setShowDate(e.target.checked);
                setResetKey((k) => k + 1);
              }}
              className="h-4 w-4 accent-emerald-700"
            />
            <span>Mostrar fecha</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={showBudget}
              onChange={(e) => {
                setShowBudget(e.target.checked);
                setResetKey((k) => k + 1);
              }}
              className="h-4 w-4 accent-emerald-700"
            />
            <span>Mostrar presupuesto</span>
          </label>
        </div>
      </div>

      <RevealCard
        key={`${mode}-${isBlocked}-${resetKey}`}
        token="demo-token"
        initialInfo={{
          participantName: isAssisted ? "Abuela Rosa" : "Benja",
          isAssisted,
          canReveal: !isBlocked,
          eventTitle: "Navidad Familia 2026 (Ejemplo)",
          organizerName: "Benja",
        }}
        demoMode={{
          targetName: isAssisted ? "Tía Carmen" : "Abuela Rosa",
          eventDate: showDate ? "24 de diciembre" : null,
          budget: showBudget ? "$15.000 aprox." : null,
        }}
      />
    </div>
  );
}
