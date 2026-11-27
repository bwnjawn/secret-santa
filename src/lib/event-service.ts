import { and, eq, gt, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { events, exclusions, participants } from "@/db/schema";
import { DrawImpossibleError, generateSecretSantaAssignments } from "@/lib/draw";
import { generateId, generateOpaqueToken } from "@/lib/tokens";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface CreateParticipantInput {
  clientId: string;
  name: string;
  isAssisted?: boolean;
}

export interface CreateExclusionInput {
  giverClientId: string;
  excludedClientId: string;
  mutual?: boolean;
}

export interface CreateEventInput {
  title: string;
  organizerName?: string | null;
  eventDate?: string | null;
  budget?: string | null;
  participants: CreateParticipantInput[];
  exclusions?: CreateExclusionInput[];
}

export interface AdminParticipantSummary {
  id: string;
  name: string;
  token: string;
  isAssisted: boolean;
  remainingViews: number;
  viewedAt: number | null;
}

export interface AdminDashboardData {
  event: {
    id: string;
    title: string;
    organizerName: string | null;
    eventDate: string | null;
    budget: string | null;
    createdAt: number;
  };
  participants: AdminParticipantSummary[];
}

export interface ParticipantWelcomeInfo {
  participantName: string;
  isAssisted: boolean;
  canReveal: boolean;
  eventTitle: string;
  organizerName: string | null;
}

export type RevealResult =
  | {
      ok: true;
      data: {
        participantName: string;
        targetName: string;
        isAssisted: boolean;
        eventTitle: string;
        eventDate: string | null;
        budget: string | null;
      };
    }
  | {
      ok: false;
      status: 404 | 409;
      error: string;
      organizerName?: string | null;
    };

function normalizeOptionalText(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createEventAndDraw(
  db: AppDatabase,
  input: CreateEventInput
): Promise<{ eventId: string; adminToken: string }> {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    throw new ValidationError("El nombre del evento es obligatorio.");
  }
  if (title.length > 100) {
    throw new ValidationError("El nombre del evento no puede superar 100 caracteres.");
  }

  if (!Array.isArray(input.participants) || input.participants.length < 3) {
    throw new ValidationError("Debes ingresar al menos 3 participantes.");
  }
  if (input.participants.length > 60) {
    throw new ValidationError("El máximo permitido por evento es 60 participantes.");
  }

  const normalizedParticipants = input.participants.map((p) => ({
    clientId: String(p.clientId || "").trim(),
    name: typeof p.name === "string" ? p.name.trim() : "",
    isAssisted: Boolean(p.isAssisted),
  }));

  if (normalizedParticipants.some((p) => !p.clientId || !p.name)) {
    throw new ValidationError("Todos los participantes deben tener un nombre válido.");
  }

  const seenNames = new Set<string>();
  for (const p of normalizedParticipants) {
    const key = p.name.toLocaleLowerCase("es");
    if (seenNames.has(key)) {
      throw new ValidationError(
        `El nombre "${p.name}" está repetido. Agrega un apellido o apodo para diferenciarlos.`
      );
    }
    seenNames.add(key);
  }

  const clientToId = new Map<string, string>();
  const participantRecords = normalizedParticipants.map((p) => {
    const id = generateId();
    clientToId.set(p.clientId, id);
    return {
      id,
      name: p.name,
      token: generateOpaqueToken(16),
      isAssisted: p.isAssisted,
    };
  });

  if (clientToId.size !== normalizedParticipants.length) {
    throw new ValidationError("Identificadores de participantes inválidos.");
  }

  const exclusionPairs: Array<{ giverId: string; excludedId: string }> = [];
  const exclusionSet = new Set<string>();

  for (const rule of input.exclusions ?? []) {
    const giverId = clientToId.get(String(rule.giverClientId || ""));
    const excludedId = clientToId.get(String(rule.excludedClientId || ""));
    if (!giverId || !excludedId || giverId === excludedId) continue;

    const addPair = (from: string, to: string) => {
      const pairKey = `${from}->${to}`;
      if (!exclusionSet.has(pairKey)) {
        exclusionSet.add(pairKey);
        exclusionPairs.push({ giverId: from, excludedId: to });
      }
    };

    addPair(giverId, excludedId);
    if (rule.mutual) {
      addPair(excludedId, giverId);
    }
  }

  // Ejecuta el sorteo antes de abrir transacción; si es imposible lanza DrawImpossibleError
  const assignments = generateSecretSantaAssignments(
    participantRecords.map((p) => p.id),
    exclusionPairs
  );

  const eventId = generateId();
  const adminToken = generateOpaqueToken(18);
  const createdAt = Date.now();
  const organizerName = normalizeOptionalText(input.organizerName);
  const eventDate = normalizeOptionalText(input.eventDate);
  const budget = normalizeOptionalText(input.budget);

  await db.transaction(async (tx) => {
    await tx.insert(events).values({
      id: eventId,
      adminToken,
      title,
      organizerName,
      eventDate,
      budget,
      createdAt,
    });

    await tx.insert(participants).values(
      participantRecords.map((p) => ({
        id: p.id,
        eventId,
        name: p.name,
        token: p.token,
        targetId: assignments.get(p.id)!,
        isAssisted: p.isAssisted,
        remainingViews: 1,
        viewedAt: null,
      }))
    );

    if (exclusionPairs.length > 0) {
      await tx.insert(exclusions).values(
        exclusionPairs.map((pair) => ({
          eventId,
          giverId: pair.giverId,
          excludedId: pair.excludedId,
        }))
      );
    }
  });

  return { eventId, adminToken };
}

/**
 * Devuelve datos del panel de administración con proyección estricta sin spoilers.
 * Nunca selecciona ni expone targetId.
 */
export async function getAdminDashboardData(
  db: AppDatabase,
  adminToken: string
): Promise<AdminDashboardData | null> {
  const [eventRow] = await db
    .select({
      id: events.id,
      title: events.title,
      organizerName: events.organizerName,
      eventDate: events.eventDate,
      budget: events.budget,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(eq(events.adminToken, adminToken))
    .limit(1);

  if (!eventRow) {
    return null;
  }

  const participantRows = await db
    .select({
      id: participants.id,
      name: participants.name,
      token: participants.token,
      isAssisted: participants.isAssisted,
      remainingViews: participants.remainingViews,
      viewedAt: participants.viewedAt,
    })
    .from(participants)
    .where(eq(participants.eventId, eventRow.id));

  return {
    event: eventRow,
    participants: participantRows,
  };
}

export async function grantExtraView(
  db: AppDatabase,
  adminToken: string,
  participantId: string
): Promise<
  | {
      ok: true;
      participant: {
        id: string;
        name: string;
        remainingViews: number;
        viewedAt: number | null;
      };
    }
  | { ok: false; status: 404; error: string }
> {
  const [eventRow] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.adminToken, adminToken))
    .limit(1);

  if (!eventRow) {
    return { ok: false, status: 404, error: "Evento no encontrado." };
  }

  const [updated] = await db
    .update(participants)
    .set({
      remainingViews: sql`${participants.remainingViews} + 1`,
    })
    .where(
      and(eq(participants.id, participantId), eq(participants.eventId, eventRow.id))
    )
    .returning({
      id: participants.id,
      name: participants.name,
      remainingViews: participants.remainingViews,
      viewedAt: participants.viewedAt,
    });

  if (!updated) {
    return { ok: false, status: 404, error: "Participante no encontrado." };
  }

  return { ok: true, participant: updated };
}

/**
 * Obtiene únicamente la pantalla de bienvenida para el GET inicial.
 * Nunca consulta el targetId ni descuenta vistas (protección contra bots de WhatsApp).
 */
export async function getParticipantWelcomeInfo(
  db: AppDatabase,
  token: string
): Promise<ParticipantWelcomeInfo | null> {
  const [row] = await db
    .select({
      participantName: participants.name,
      isAssisted: participants.isAssisted,
      remainingViews: participants.remainingViews,
      eventTitle: events.title,
      organizerName: events.organizerName,
    })
    .from(participants)
    .innerJoin(events, eq(participants.eventId, events.id))
    .where(eq(participants.token, token))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    participantName: row.participantName,
    isAssisted: row.isAssisted,
    canReveal: row.remainingViews > 0,
    eventTitle: row.eventTitle,
    organizerName: row.organizerName,
  };
}

/**
 * Revela el resultado descontando 1 vista de forma atómica en BD.
 */
export async function revealParticipantTarget(
  db: AppDatabase,
  token: string
): Promise<RevealResult> {
  const now = Date.now();

  const [consumed] = await db
    .update(participants)
    .set({
      remainingViews: sql`${participants.remainingViews} - 1`,
      viewedAt: sql`COALESCE(${participants.viewedAt}, ${now})`,
    })
    .where(and(eq(participants.token, token), gt(participants.remainingViews, 0)))
    .returning({
      id: participants.id,
      eventId: participants.eventId,
      name: participants.name,
      targetId: participants.targetId,
      isAssisted: participants.isAssisted,
    });

  if (!consumed) {
    const [existing] = await db
      .select({
        id: participants.id,
        organizerName: events.organizerName,
      })
      .from(participants)
      .innerJoin(events, eq(participants.eventId, events.id))
      .where(eq(participants.token, token))
      .limit(1);

    if (!existing) {
      return {
        ok: false,
        status: 404,
        error: "Este enlace no existe o es inválido.",
      };
    }

    return {
      ok: false,
      status: 409,
      error: "Este resultado ya fue revelado.",
      organizerName: existing.organizerName,
    };
  }

  const [targetRow] = await db
    .select({ name: participants.name })
    .from(participants)
    .where(eq(participants.id, consumed.targetId))
    .limit(1);

  const [eventRow] = await db
    .select({
      title: events.title,
      eventDate: events.eventDate,
      budget: events.budget,
    })
    .from(events)
    .where(eq(events.id, consumed.eventId))
    .limit(1);

  if (!targetRow || !eventRow) {
    return {
      ok: false,
      status: 404,
      error: "No se pudo encontrar la asignación del sorteo.",
    };
  }

  return {
    ok: true,
    data: {
      participantName: consumed.name,
      targetName: targetRow.name,
      isAssisted: consumed.isAssisted,
      eventTitle: eventRow.title,
      eventDate: eventRow.eventDate,
      budget: eventRow.budget,
    },
  };
}

export { DrawImpossibleError };
