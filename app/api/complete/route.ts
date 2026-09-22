// POST /api/complete   body: { guestId, challengeId, photoUrl, caption? }
// L'invité soumet une photo pour un défi. Elle est enregistrée "en attente"
// (status 'pending') : c'est Camille qui validera ensuite via /admin.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requiredToFinish } from "@/lib/rules";

export async function POST(req: NextRequest) {
  let body: {
    guestId?: string;
    challengeId?: string;
    photoUrl?: string;
    caption?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { guestId, challengeId, photoUrl } = body;
  if (!guestId || !challengeId || !photoUrl) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  // Légende optionnelle (ex. l'œuvre imitée) : nettoyée et bornée à 140 car.
  const caption =
    typeof body.caption === "string" && body.caption.trim()
      ? body.caption.trim().slice(0, 140)
      : null;

  const [{ data: guest, error: guestErr }, { data: challenge }] =
    await Promise.all([
      supabaseAdmin
        .from("guests")
        .select("id, submitted_all_at")
        .eq("id", guestId)
        .single(),
      supabaseAdmin
        .from("challenges")
        .select("caption_label")
        .eq("id", challengeId)
        .single(),
    ]);

  if (guestErr || !guest) {
    return NextResponse.json({ error: "Invité introuvable." }, { status: 404 });
  }

  // Si le défi exige une légende (ex. l'œuvre imitée), elle est obligatoire.
  if (challenge?.caption_label && !caption) {
    return NextResponse.json(
      { error: "Merci d'indiquer l'œuvre imitée avant d'envoyer." },
      { status: 400 }
    );
  }

  // Enregistre la photo "en attente". Si le défi avait déjà une photo (ex. après
  // un refus), on la remplace et on repasse en attente.
  const { error: insErr } = await supabaseAdmin
    .from("completions")
    .upsert(
      {
        guest_id: guestId,
        challenge_id: challengeId,
        photo_url: photoUrl,
        status: "pending",
        caption,
      },
      { onConflict: "guest_id,challenge_id" }
    );

  if (insErr) {
    return NextResponse.json(
      { error: "Enregistrement impossible." },
      { status: 500 }
    );
  }

  // A-t-il maintenant soumis ASSEZ de défis (5 sur 7, photos non refusées) ? Si
  // oui et que ce n'est pas déjà enregistré, on fige son heure de soumission
  // complète (= rang).
  const [{ count: total }, { count: covered }] = await Promise.all([
    supabaseAdmin.from("challenges").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("completions")
      .select("*", { count: "exact", head: true })
      .eq("guest_id", guestId)
      .neq("status", "rejected"),
  ]);
  if (total && (covered ?? 0) >= requiredToFinish(total) && !guest.submitted_all_at) {
    await supabaseAdmin
      .from("guests")
      .update({ submitted_all_at: new Date().toISOString() })
      .eq("id", guestId);
  }

  return NextResponse.json({ ok: true });
}

