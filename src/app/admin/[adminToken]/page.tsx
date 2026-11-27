import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { getAdminDashboardData } from "@/lib/event-service";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del Organizador · Amigo Secreto",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ adminToken: string }>;
}) {
  const { adminToken } = await params;
  const data = await getAdminDashboardData(getDb(), adminToken);

  if (!data) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
        <h1 className="text-xl font-bold text-stone-900">Sorteo no encontrado</h1>
        <p className="mt-2 text-sm text-stone-600">
          El enlace de administrador no es válido o fue eliminado.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Crear un nuevo sorteo
        </Link>
      </div>
    );
  }

  return <AdminDashboard adminToken={adminToken} initialData={data} />;
}
