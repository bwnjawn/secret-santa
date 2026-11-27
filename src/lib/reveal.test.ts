import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createDatabase, type AppDatabase } from "@/db";
import {
  createEventAndDraw,
  getAdminDashboardData,
  getParticipantWelcomeInfo,
  grantExtraView,
  revealParticipantTarget,
  ValidationError,
} from "./event-service";

async function setupSchema(client: Client) {
  await client.executeMultiple(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE events (
      id TEXT PRIMARY KEY NOT NULL,
      admin_token TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      organizer_name TEXT,
      event_date TEXT,
      budget TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE participants (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      target_id TEXT NOT NULL,
      is_assisted INTEGER DEFAULT 0 NOT NULL,
      remaining_views INTEGER DEFAULT 1 NOT NULL,
      viewed_at INTEGER
    );
    CREATE TABLE exclusions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      giver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      excluded_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE
    );
  `);
}

describe("event-service flujo completo", () => {
  let client: Client;
  let db: AppDatabase;

  beforeEach(async () => {
    const conn = createDatabase(":memory:");
    client = conn.client;
    db = conn.db;
    await setupSchema(client);
  });

  afterEach(() => {
    client.close();
  });

  it("crea sorteo, oculta targetId en admin, protege GET y quema link al revelar", async () => {
    const { adminToken } = await createEventAndDraw(db, {
      title: "Navidad Familia",
      organizerName: "Benja",
      eventDate: "24 de diciembre",
      budget: "",
      participants: [
        { clientId: "1", name: "Benja", isAssisted: false },
        { clientId: "2", name: "Abuela", isAssisted: true },
        { clientId: "3", name: "Mamá", isAssisted: false },
        { clientId: "4", name: "Papá", isAssisted: false },
      ],
      exclusions: [{ giverClientId: "3", excludedClientId: "4", mutual: true }],
    });

    const dashboard = await getAdminDashboardData(db, adminToken);
    expect(dashboard).not.toBeNull();
    expect(dashboard!.event.eventDate).toBe("24 de diciembre");
    expect(dashboard!.event.budget).toBeNull();
    expect(dashboard!.participants).toHaveLength(4);

    // Garantiza que el panel admin jamás exponga targetId
    for (const p of dashboard!.participants) {
      expect("targetId" in p).toBe(false);
    }

    const abuela = dashboard!.participants.find((p) => p.name === "Abuela")!;
    expect(abuela.isAssisted).toBe(true);
    expect(abuela.remainingViews).toBe(1);

    // GET inicial (simula bot de WhatsApp) NO consume la vista ni revela resultado
    const welcome1 = await getParticipantWelcomeInfo(db, abuela.token);
    expect(welcome1?.canReveal).toBe(true);
    expect(welcome1?.isAssisted).toBe(true);
    expect("targetName" in (welcome1 ?? {})).toBe(false);

    const welcome2 = await getParticipantWelcomeInfo(db, abuela.token);
    expect(welcome2?.canReveal).toBe(true);

    // Primer POST sí revela y quema la vista al instante
    const reveal1 = await revealParticipantTarget(db, abuela.token);
    expect(reveal1.ok).toBe(true);
    if (reveal1.ok) {
      expect(reveal1.data.targetName).not.toBe("Abuela");
      expect(reveal1.data.eventDate).toBe("24 de diciembre");
      expect(reveal1.data.budget).toBeNull();
    }

    // Segundo POST queda bloqueado (409)
    const reveal2 = await revealParticipantTarget(db, abuela.token);
    expect(reveal2.ok).toBe(false);
    if (!reveal2.ok) {
      expect(reveal2.status).toBe(409);
      expect(reveal2.organizerName).toBe("Benja");
    }

    // Admin puede otorgar 1 vista extra sin ver el resultado
    const grant = await grantExtraView(db, adminToken, abuela.id);
    expect(grant.ok).toBe(true);
    if (grant.ok) {
      expect(grant.participant.remainingViews).toBe(1);
    }

    const reveal3 = await revealParticipantTarget(db, abuela.token);
    expect(reveal3.ok).toBe(true);
    if (reveal3.ok && reveal1.ok) {
      expect(reveal3.data.targetName).toBe(reveal1.data.targetName);
    }

    const reveal4 = await revealParticipantTarget(db, abuela.token);
    expect(reveal4.ok).toBe(false);
  });

  it("rechaza nombres duplicados entre participantes", async () => {
    await expect(
      createEventAndDraw(db, {
        title: "Prueba",
        participants: [
          { clientId: "1", name: "Juan" },
          { clientId: "2", name: "juan" },
          { clientId: "3", name: "Ana" },
        ],
      })
    ).rejects.toThrow(ValidationError);
  });
});
