import { describe, it, expect } from "vitest";
import { REQUIRED_CHALLENGES, requiredToFinish } from "../lib/rules";

describe("requiredToFinish", () => {
  it("exige 5 défis quand il y en a 7", () => {
    expect(REQUIRED_CHALLENGES).toBe(5);
    expect(requiredToFinish(7)).toBe(5);
  });

  it("ne dépasse jamais le nombre de défis existants", () => {
    expect(requiredToFinish(3)).toBe(3);
    expect(requiredToFinish(0)).toBe(0);
  });

  it("reste à 5 si plus de défis sont ajoutés", () => {
    expect(requiredToFinish(10)).toBe(5);
  });
});
