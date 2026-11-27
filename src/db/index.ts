import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type AppDatabase = LibSQLDatabase<typeof schema>;

/**
 * Crea una instancia de cliente libSQL y Drizzle ORM.
 * Usa TURSO_DATABASE_URL (por defecto file:local.db en local) y TURSO_AUTH_TOKEN.
 */
export function createDatabase(url?: string, authToken?: string): {
  client: Client;
  db: AppDatabase;
} {
  const databaseUrl = url ?? process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const token = authToken ?? process.env.TURSO_AUTH_TOKEN;

  const client = createClient({
    url: databaseUrl,
    ...(token ? { authToken: token } : {}),
  });

  const db = drizzle(client, { schema });
  return { client, db };
}

const globalForDb = globalThis as unknown as {
  __secretSantaDb?: AppDatabase;
};

export function getDb(): AppDatabase {
  if (!globalForDb.__secretSantaDb) {
    globalForDb.__secretSantaDb = createDatabase().db;
  }
  return globalForDb.__secretSantaDb;
}
