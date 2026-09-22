// GET /api/admin/export — télécharge TOUTES les photos du jeu dans un ZIP.
// Réservé à l'admin (Camille) : protégé par le cookie admin.
//
// Le serveur récupère lui-même chaque photo depuis Supabase Storage (pas de
// souci de CORS côté navigateur) et les empaquette dans un ZIP envoyé en
// streaming — on ne garde jamais tout le ZIP en mémoire.
//
// Organisation : un dossier par invité, fichiers nommés
//   "<position>_<titre du défi>.jpg"  (+ suffixe " (en attente)" / " (refusée)"
//   pour les photos non encore validées).
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { isAdminReq } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { zipEntryName, uniqueName } from "@/lib/exportNames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // gros export = potentiellement long

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // On récupère tout ce qu'il faut pour nommer joliment les fichiers.
  const [{ data: completions }, { data: guests }, { data: challenges }] =
    await Promise.all([
      supabaseAdmin
        .from("completions")
        .select("guest_id, challenge_id, photo_url, status, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("guests").select("id, name"),
      supabaseAdmin.from("challenges").select("id, position, title"),
    ]);

  if (!completions || completions.length === 0) {
    return NextResponse.json(
      { error: "Aucune photo à exporter pour l'instant." },
      { status: 404 }
    );
  }

  const guestName = new Map((guests ?? []).map((g) => [g.id, g.name]));
  const challenge = new Map(
    (challenges ?? []).map((c) => [c.id, { position: c.position, title: c.title }])
  );

  const archive = new ZipArchive({ store: true }); // jpg déjà compressés
  // Si une photo manque (404…), on ne casse pas tout l'export.
  archive.on("warning", () => {});
  archive.on("error", () => {});

  // Empaquetage en tâche de fond pendant que la réponse se streame.
  (async () => {
    const used = new Set<string>(); // évite les collisions de noms
    for (const c of completions) {
      const ch = challenge.get(c.challenge_id);
      const entry = uniqueName(
        zipEntryName({
          guestName: guestName.get(c.guest_id),
          position: ch?.position,
          title: ch?.title,
          status: c.status,
        }),
        used
      );

      try {
        const res = await fetch(c.photo_url);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        archive.append(buf, { name: entry });
      } catch {
        // photo injoignable : on l'ignore et on continue.
      }
    }
    archive.finalize();
  })();

  // Archiver est un flux Node ; on le convertit en flux web pour la Response.
  const webStream = Readable.toWeb(archive) as unknown as ReadableStream;
  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="photos-mariage-marine-clement.zip"',
      "Cache-Control": "no-store",
    },
  });
}
