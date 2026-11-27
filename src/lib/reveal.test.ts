import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { createDatabase, ensureDatabaseSchema, type AppDatabase } from "@/db";
import {
  createEventAndDraw,
  getAdminDashboardData,
  getParticipantWelcomeInfo,
  grantExtraView,
  revealParticipantTarget,
  ValidationError,
} from "./event-service";

describe("event-service flujo completo", () => {
  let client: Client;
  let db: AppDatabase;

  beforeEach(async () => {
    const conn = createDatabase(":memory:");
    client = conn.client;
    db = conn.db;
    await ensureDatabaseSchema(client);
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
