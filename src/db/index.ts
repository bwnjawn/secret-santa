import { createClient as createNodeClient, type Client } from "@libsql/client";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle as drizzleNode, type LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzleWeb } from "drizzle-orm/libsql/web";
import * as schema from "./schema";

export type AppDatabase = LibSQLDatabase<typeof schema>;

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    admin_token TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    organizer_name TEXT,
    event_date TEXT,
    budget TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    target_id TEXT NOT NULL,
    is_assisted INTEGER DEFAULT 0 NOT NULL,
    remaining_views INTEGER DEFAULT 1 NOT NULL,
    viewed_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS participants_event_idx ON participants (event_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS participants_token_idx ON participants (token)`,
  `CREATE TABLE IF NOT EXISTS exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    giver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    excluded_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS exclusions_event_idx ON exclusions (event_id)`,
];

function resolveEnvPair(): { url: string; authToken?: string } {
  const directUrl = process.env.TURSO_DATABASE_URL?.trim();
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (directUrl) {
    return { url: directUrl, ...(directToken ? { authToken: directToken } : {}) };
  }

  // Soporta prefijos creados por integraciones del marketplace (ej. STORAGE_ o personalizado)
  const fallbackUrlEntry = Object.entries(process.env).find(
    ([key, val]) =>
      Boolean(val?.trim()) &&
      (/^.+_TURSO_DATABASE_URL$/.test(key) ||
        /^(STORAGE|ALMACENAMIENTO)(_DATABASE)?_URL$/.test(key))
  );

  const fallbackTokenEntry = Object.entries(process.env).find(
    ([key, val]) =>
      Boolean(val?.trim()) &&
      (/^.+_TURSO_AUTH_TOKEN$/.test(key) ||
        /^(STORAGE|ALMACENAMIENTO)_AUTH_TOKEN$/.test(key))
  );

  const resolvedUrl = fallbackUrlEntry?.[1]?.trim();
  const resolvedToken = directToken || fallbackTokenEntry?.[1]?.trim();

  if (resolvedUrl) {
    return { url: resolvedUrl, ...(resolvedToken ? { authToken: resolvedToken } : {}) };
  }

  if (process.env.VERCEL) {
    throw new DatabaseConfigError(
      "Falta configurar TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel (Settings -> Environment Variables)."
    );
  }

  return { url: "file:local.db" };
}

function isRemoteLibsqlUrl(url: string): boolean {
  return (
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("wss://") ||
    url.startsWith("ws://")
  );
}

/**
 * Crea una instancia de cliente libSQL y Drizzle ORM.
 * Usa el cliente Web/HTTP para Turso remoto (sin binarios nativos en Vercel)
 * y el cliente Node para SQLite local/memoria.
 */
export function createDatabase(url?: string, authToken?: string): {
  client: Client;
  db: AppDatabase;
} {
  const envPair = url ? { url, authToken } : resolveEnvPair();
  const databaseUrl = envPair.url;
  const token = envPair.authToken;

  if (isRemoteLibsqlUrl(databaseUrl)) {
    const client = createWebClient({
      url: databaseUrl,
      ...(token ? { authToken: token } : {}),
    });
    const db = drizzleWeb(client, { schema }) as unknown as AppDatabase;
    return { client: client as unknown as Client, db };
  }

  const client = createNodeClient({
    url: databaseUrl,
    ...(token ? { authToken: token } : {}),
  });

  const db = drizzleNode(client, { schema });
  return { client, db };
}

/**
 * Asegura de forma idempotente que las tablas existan en la base de datos.
 */
export async function ensureDatabaseSchema(client: Client): Promise<void> {
  await client.batch(SCHEMA_STATEMENTS, "write");
}

const globalForDb = globalThis as unknown as {
  __secretSantaConn?: { client: Client; db: AppDatabase };
  __secretSantaSchemaPromise?: Promise<void>;
};

export function getDb(): AppDatabase {
  if (!globalForDb.__secretSantaConn) {
    globalForDb.__secretSantaConn = createDatabase();
  }
  return globalForDb.__secretSantaConn.db;
}

export async function getReadyDb(): Promise<AppDatabase> {
  if (!globalForDb.__secretSantaConn) {
    globalForDb.__secretSantaConn = createDatabase();
  }

  if (!globalForDb.__secretSantaSchemaPromise) {
    globalForDb.__secretSantaSchemaPromise = ensureDatabaseSchema(
      globalForDb.__secretSantaConn.client
    ).catch((err) => {
      globalForDb.__secretSantaSchemaPromise = undefined;
      throw err;
    });
  }

  await globalForDb.__secretSantaSchemaPromise;
  return globalForDb.__secretSantaConn.db;
}
