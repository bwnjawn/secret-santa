import { randomBytes, randomUUID } from "node:crypto";

/** Genera un identificador unico para entidades internas. */
export function generateId(): string {
  return randomUUID();
}

/** Genera un token opaco apto para URLs que no revela informacion del participante. */
export function generateOpaqueToken(byteLength = 16): string {
  return randomBytes(byteLength).toString("base64url");
}
