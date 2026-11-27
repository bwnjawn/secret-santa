import type { Metadata } from "next";
import { Lock } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigo Secreto Familiar",
  description: "Abre tu invitación privada para descubrir a quién te tocó regalar.",
  openGraph: {
    title: "Amigo Secreto Familiar",
    description: "Abre tu invitación privada para descubrir a quién te tocó regalar.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="relative min-h-screen overflow-x-hidden text-stone-900">
        <div className="uiverse-pattern-bg fixed inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-5 sm:px-6 sm:py-10">
          <main className="flex-1">{children}</main>
          <footer className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-4 py-2 text-center text-xs font-medium text-stone-700 shadow-sm backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
              <span>Amigo Secreto Familiar · Enlaces privados de un solo uso</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
