import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  createEventAndDraw,
  DrawImpossibleError,
  ValidationError,
} from "@/lib/event-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const result = await createEventAndDraw(db, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DrawImpossibleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
    }
    console.error("Error al crear evento:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el sorteo." },
      { status: 500 }
    );
  }
}
