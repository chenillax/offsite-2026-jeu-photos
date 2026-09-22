import { describe, it, expect } from "vitest";
import {
  safeName,
  statusSuffix,
  zipEntryName,
  uniqueName,
} from "../lib/exportNames";

describe("safeName", () => {
  it("remplace les caractères interdits par des tirets", () => {
    expect(safeName('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("condense les espaces et coupe aux extrémités", () => {
    expect(safeName("  Marie   Dupont  ")).toBe("Marie Dupont");
  });

  it("retombe sur 'sans-nom' quand le résultat est vide", () => {
    expect(safeName("   ")).toBe("sans-nom");
    expect(safeName("")).toBe("sans-nom");
  });

  it("tronque à 80 caractères", () => {
    expect(safeName("x".repeat(200))).toHaveLength(80);
  });
});

describe("statusSuffix", () => {
  it("aucun suffixe pour une photo validée", () => {
    expect(statusSuffix("approved")).toBe("");
  });
  it("suffixe explicite pour refusée et en attente", () => {
    expect(statusSuffix("rejected")).toBe(" (refusée)");
    expect(statusSuffix("pending")).toBe(" (en attente)");
  });
});

describe("zipEntryName", () => {
  it("construit le chemin dossier invité / NN_titre.jpg", () => {
    expect(
      zipEntryName({
        guestName: "Marie Dupont",
        position: 4,
        title: "Selfie discret",
        status: "approved",
      })
    ).toBe("Marie Dupont/04_Selfie discret.jpg");
  });

  it("ajoute le suffixe de statut pour une photo non validée", () => {
    expect(
      zipEntryName({
        guestName: "Paul",
        position: 7,
        title: "L'œuvre d'art",
        status: "pending",
      })
    ).toBe("Paul/07_L'œuvre d'art (en attente).jpg");
  });

  it("utilise des valeurs de repli si invité/défi manquants", () => {
    expect(
      zipEntryName({
        guestName: null,
        position: null,
        title: null,
        status: "rejected",
      })
    ).toBe("Invité inconnu/00_Défi (refusée).jpg");
  });

  it("assainit les noms d'invité et de défi", () => {
    expect(
      zipEntryName({
        guestName: "Jean/François",
        position: 1,
        title: "Photo: lieu",
        status: "approved",
      })
    ).toBe("Jean-François/01_Photo- lieu.jpg");
  });
});

describe("uniqueName", () => {
  it("laisse passer un nom inédit", () => {
    const used = new Set<string>();
    expect(uniqueName("a/01_x.jpg", used)).toBe("a/01_x.jpg");
    expect(used.has("a/01_x.jpg")).toBe(true);
  });

  it("numérote les collisions avant l'extension", () => {
    const used = new Set<string>();
    uniqueName("a/01_x.jpg", used);
    expect(uniqueName("a/01_x.jpg", used)).toBe("a/01_x (2).jpg");
    expect(uniqueName("a/01_x.jpg", used)).toBe("a/01_x (3).jpg");
  });
});
