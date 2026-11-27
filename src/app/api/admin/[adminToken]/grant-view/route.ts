import { NextResponse } from "next/server";
import { DatabaseConfigError, getReadyDb } from "@/db";
import { grantExtraView } from "@/lib/event-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ adminToken: string }> }
) {
  try {
    const { adminToken } = await context.params;
    const body = await request.json();
    const participantId =
      typeof body?.participantId === "string" ? body.participantId.trim() : "";

    if (!participantId) {
      return NextResponse.json(
        { error: "Debes indicar el participante." },
        { status: 400 }
      );
    }

    const result = await grantExtraView(
      await getReadyDb(),
      adminToken,
      participantId
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ participant: result.participant });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error al otorgar vista extra:", error);
    return NextResponse.json(
      { error: "No se pudo habilitar una vista adicional." },
      { status: 500 }
    );
  }
}
