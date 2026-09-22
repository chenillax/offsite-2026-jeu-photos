import { describe, it, expect } from "vitest";
import { ZipArchive } from "archiver";
import { Readable } from "node:stream";

// Reproduit le mécanisme exact de la route d'export : on empaquette des buffers
// dans un ZipArchive (archiver) et on lit le flux via Readable.toWeb.
// Ce test casse si une montée de version d'archiver change l'API utilisée
// (c'est ce qui avait cassé le build initialement) ou si le streaming échoue.
async function buildZip(
  entries: { name: string; data: Buffer }[]
): Promise<Buffer> {
  const archive = new ZipArchive({ store: true });
  archive.on("warning", () => {});
  archive.on("error", () => {});

  for (const e of entries) archive.append(e.data, { name: e.name });
  archive.finalize();

  const web = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of web as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

describe("export ZIP (intégration archiver)", () => {
  it("produit une archive ZIP valide et non vide", async () => {
    const zip = await buildZip([
      { name: "InviteA/01_defi.jpg", data: Buffer.from("photo-a") },
      { name: "InviteB/02_defi.jpg", data: Buffer.from("photo-b") },
    ]);

    expect(zip.length).toBeGreaterThan(0);
    // Signature d'en-tête de fichier local "PK\x03\x04".
    expect(zip.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    // Signature de fin d'archive (End Of Central Directory) "PK\x05\x06".
    expect(zip.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))).toBe(true);
  });

  it("contient bien les chemins des fichiers ajoutés", async () => {
    const zip = await buildZip([
      { name: "InviteA/01_defi.jpg", data: Buffer.from("x") },
      { name: "InviteB/02_defi.jpg", data: Buffer.from("y") },
    ]);
    const asText = zip.toString("latin1");
    expect(asText).toContain("InviteA/01_defi.jpg");
    expect(asText).toContain("InviteB/02_defi.jpg");
  });
});
