import { describe, it, expect } from "vitest";
import {
  nextReaction,
  countByCompletion,
  namesByCompletion,
} from "../lib/reactions";

describe("nextReaction", () => {
  it("pose une réaction quand il n'y en a pas", () => {
    expect(nextReaction(null, "like")).toBe("like");
    expect(nextReaction(null, "dislike")).toBe("dislike");
  });

  it("annule quand on re-clique la même réaction", () => {
    expect(nextReaction("like", "like")).toBe(null);
    expect(nextReaction("dislike", "dislike")).toBe(null);
  });

  it("bascule quand on clique l'autre réaction", () => {
    expect(nextReaction("like", "dislike")).toBe("dislike");
    expect(nextReaction("dislike", "like")).toBe("like");
  });
});

describe("countByCompletion", () => {
  it("agrège les 👍 / 👎 par photo", () => {
    const counts = countByCompletion([
      { completion_id: "a", value: "like" },
      { completion_id: "a", value: "like" },
      { completion_id: "a", value: "dislike" },
      { completion_id: "b", value: "dislike" },
    ]);
    expect(counts.get("a")).toEqual({ like: 2, dislike: 1 });
    expect(counts.get("b")).toEqual({ like: 0, dislike: 1 });
  });

  it("renvoie une map vide pour aucune réaction", () => {
    expect(countByCompletion([]).size).toBe(0);
  });

  it("ne crée pas d'entrée pour une photo sans réaction", () => {
    const counts = countByCompletion([{ completion_id: "a", value: "like" }]);
    expect(counts.has("z")).toBe(false);
  });
});

describe("namesByCompletion", () => {
  const nameOf = (id: string) =>
    ({ g1: "Marie", g2: "Paul", g3: "Léa" })[id] ?? "Un invité";

  it("regroupe les noms par photo et par 👍 / 👎", () => {
    const names = namesByCompletion(
      [
        { completion_id: "a", guest_id: "g1", value: "like" },
        { completion_id: "a", guest_id: "g2", value: "like" },
        { completion_id: "a", guest_id: "g3", value: "dislike" },
      ],
      nameOf
    );
    expect(names.get("a")).toEqual({
      like: ["Marie", "Paul"],
      dislike: ["Léa"],
    });
  });

  it("retombe sur 'Un invité' pour un guest_id inconnu", () => {
    const names = namesByCompletion(
      [{ completion_id: "a", guest_id: "zzz", value: "like" }],
      nameOf
    );
    expect(names.get("a")).toEqual({ like: ["Un invité"], dislike: [] });
  });
});
