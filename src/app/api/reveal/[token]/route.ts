import { NextResponse } from "next/server";
import { DatabaseConfigError, getReadyDb } from "@/db";
import { revealParticipantTarget } from "@/lib/event-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const result = await revealParticipantTarget(await getReadyDb(), token);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, organizerName: result.organizerName ?? null },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error al revelar amigo secreto:", error);
    return NextResponse.json(
      { error: "No se pudo consultar el resultado." },
      { status: 500 }
    );
  }
}
