import { randomInt } from "node:crypto";

export interface ExclusionRule {
  giverId: string;
  excludedId: string;
}

export class DrawImpossibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawImpossibleError";
  }
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Calcula una asignacion aleatoria valida de Amigo Secreto (derangement)
 * respetando que nadie se regale a si mismo ni a personas excluidas.
 */
export function generateSecretSantaAssignments(
  participantIds: string[],
  exclusions: ExclusionRule[] = []
): Map<string, string> {
  const uniqueIds = Array.from(new Set(participantIds));
  if (uniqueIds.length !== participantIds.length) {
    throw new DrawImpossibleError("Los participantes deben ser unicos.");
  }

  if (uniqueIds.length < 3) {
    throw new DrawImpossibleError(
      "Se necesitan al menos 3 participantes para hacer un Amigo Secreto."
    );
  }

  const excludedByGiver = new Map<string, Set<string>>();
  for (const id of uniqueIds) {
    excludedByGiver.set(id, new Set([id]));
  }

  for (const rule of exclusions) {
    excludedByGiver.get(rule.giverId)?.add(rule.excludedId);
  }

  const allowedByGiver = new Map<string, string[]>();
  for (const giverId of uniqueIds) {
    const excluded = excludedByGiver.get(giverId)!;
    const candidates = uniqueIds.filter((candidateId) => !excluded.has(candidateId));
    if (candidates.length === 0) {
      throw new DrawImpossibleError(
        "Las exclusiones dejan a al menos una persona sin opciones posibles."
      );
    }
    allowedByGiver.set(giverId, shuffleInPlace(candidates));
  }

  const remainingGivers = new Set(uniqueIds);
  const usedTargets = new Set<string>();
  const assignments = new Map<string, string>();
  let steps = 0;
  const maxSteps = 100_000;

  function pickNextGiver(): string | null {
    let bestGiver: string | null = null;
    let bestCount = Number.POSITIVE_INFINITY;

    for (const giverId of remainingGivers) {
      const options = allowedByGiver.get(giverId)!;
      let count = 0;
      for (const targetId of options) {
        if (!usedTargets.has(targetId)) count++;
      }
      if (count === 0) return giverId; // Falla rapido si alguien se quedo sin opciones
      if (count < bestCount) {
        bestCount = count;
        bestGiver = giverId;
      }
    }
    return bestGiver;
  }

  function backtrack(): boolean {
    if (assignments.size === uniqueIds.length) {
      return true;
    }

    steps++;
    if (steps > maxSteps) {
      return false;
    }

    const giverId = pickNextGiver();
    if (!giverId) return false;

    const candidates = allowedByGiver
      .get(giverId)!
      .filter((targetId) => !usedTargets.has(targetId));

    if (candidates.length === 0) {
      return false;
    }

    remainingGivers.delete(giverId);
    for (const targetId of candidates) {
      usedTargets.add(targetId);
      assignments.set(giverId, targetId);

      if (backtrack()) {
        return true;
      }

      assignments.delete(giverId);
      usedTargets.delete(targetId);
    }
    remainingGivers.add(giverId);
    return false;
  }

  if (!backtrack()) {
    throw new DrawImpossibleError(
      "No es posible realizar el sorteo con estas exclusiones. Prueba quitando alguna restriccion."
    );
  }

  return assignments;
}
