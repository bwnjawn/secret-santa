import { describe, expect, it } from "vitest";
import { DrawImpossibleError, generateSecretSantaAssignments } from "./draw";

describe("generateSecretSantaAssignments", () => {
  it("asigna a cada persona un destinatario único y distinto de sí misma", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const result = generateSecretSantaAssignments(ids);

    expect(result.size).toBe(ids.length);
    const targets = new Set<string>();
    for (const giver of ids) {
      const target = result.get(giver);
      expect(target).toBeDefined();
      expect(target).not.toBe(giver);
      targets.add(target!);
    }
    expect(targets.size).toBe(ids.length);
  });

  it("respeta exclusiones unidireccionales y mutuas", () => {
    const ids = ["p1", "p2", "p3", "p4", "p5", "p6"];
    const exclusions = [
      { giverId: "p1", excludedId: "p2" },
      { giverId: "p2", excludedId: "p1" },
      { giverId: "p3", excludedId: "p4" },
      { giverId: "p4", excludedId: "p3" },
      { giverId: "p5", excludedId: "p1" },
    ];

    for (let i = 0; i < 20; i++) {
      const result = generateSecretSantaAssignments(ids, exclusions);
      for (const rule of exclusions) {
        expect(result.get(rule.giverId)).not.toBe(rule.excludedId);
      }
    }
  });

  it("falla si hay menos de 3 participantes", () => {
    expect(() => generateSecretSantaAssignments(["a", "b"])).toThrow(
      DrawImpossibleError
    );
  });

  it("detecta cuando las exclusiones hacen imposible el sorteo", () => {
    // p1 solo puede regalar a p2, y p3 también solo puede regalar a p2 -> imposible
    const ids = ["p1", "p2", "p3"];
    const exclusions = [
      { giverId: "p1", excludedId: "p3" },
      { giverId: "p3", excludedId: "p1" },
    ];

    expect(() => generateSecretSantaAssignments(ids, exclusions)).toThrow(
      DrawImpossibleError
    );
  });
});
