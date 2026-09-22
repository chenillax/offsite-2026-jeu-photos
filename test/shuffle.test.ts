import { describe, it, expect } from "vitest";
import { shuffle } from "../lib/shuffle";

describe("shuffle", () => {
  it("ne mute pas le tableau d'entrée", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input, () => 0.5);
    expect(input).toEqual(copy);
  });

  it("conserve tous les éléments (c'est une permutation)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, () => 0.42);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(out).toHaveLength(input.length);
  });

  it("est déterministe pour un même générateur", () => {
    const seq = [0.1, 0.9, 0.3, 0.7, 0.5, 0.2];
    const rng1 = (() => {
      let i = 0;
      return () => seq[i++ % seq.length];
    })();
    const rng2 = (() => {
      let i = 0;
      return () => seq[i++ % seq.length];
    })();
    expect(shuffle([1, 2, 3, 4, 5], rng1)).toEqual(
      shuffle([1, 2, 3, 4, 5], rng2)
    );
  });

  it("gère les tableaux vides et à un élément", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });
});
