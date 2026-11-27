import { NextResponse } from "next/server";
import { DatabaseConfigError, getReadyDb } from "@/db";
import { getAdminDashboardData } from "@/lib/event-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ adminToken: string }> }
) {
  try {
    const { adminToken } = await context.params;
    const data = await getAdminDashboardData(await getReadyDb(), adminToken);
    if (!data) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error al cargar panel admin:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el panel de administración." },
      { status: 500 }
    );
  }
}
