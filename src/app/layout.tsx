import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigo Secreto Familiar 🎁",
  description: "Abre tu invitación privada para descubrir a quién te tocó regalar.",
  openGraph: {
    title: "Amigo Secreto Familiar 🎁",
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
      <body className="min-h-screen bg-[#faf7f2] text-stone-900">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
          <main className="flex-1">{children}</main>
          <footer className="mt-10 border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
            Amigo Secreto Familiar · Enlaces privados de un solo uso
          </footer>
        </div>
      </body>
    </html>
  );
}
