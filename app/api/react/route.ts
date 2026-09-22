// POST /api/react   body: { guestId, completionId, value: 'like' | 'dislike' }
// Pose / bascule / annule la réaction de l'invité sur une photo.
//
// Toutes les écritures passent par ici (clé service_role) : le navigateur ne
// peut pas écrire directement dans la table (RLS). La LECTURE des réactions
// (compteurs + noms) se fait, elle, directement côté navigateur (clé anon).
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { nextReaction } from "@/lib/reactions";
import type { ReactionValue } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: {
    guestId?: string;
    completionId?: string;
    value?: ReactionValue;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { guestId, completionId, value } = body;
  if (
    !guestId ||
    !completionId ||
    (value !== "like" && value !== "dislike")
  ) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // L'invité et la photo existent-ils ?
  const [{ data: guest }, { data: completion }] = await Promise.all([
    supabaseAdmin.from("guests").select("id").eq("id", guestId).single(),
    supabaseAdmin
      .from("completions")
      .select("id")
      .eq("id", completionId)
      .single(),
  ]);
  if (!guest || !completion) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  // Réaction actuelle de l'invité sur cette photo.
  const { data: existing } = await supabaseAdmin
    .from("reactions")
    .select("id, value")
    .eq("guest_id", guestId)
    .eq("completion_id", completionId)
    .maybeSingle();

  const current = (existing?.value as ReactionValue | undefined) ?? null;
  const target = nextReaction(current, value);

  if (target === null) {
    // Annulation : on retire la réaction si elle existait.
    if (existing) {
      const { error } = await supabaseAdmin
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json(
          { error: "Mise à jour impossible." },
          { status: 500 }
        );
      }
    }
  } else {
    // Pose ou bascule : upsert sur (completion_id, guest_id).
    const { error } = await supabaseAdmin.from("reactions").upsert(
      {
        guest_id: guestId,
        completion_id: completionId,
        value: target,
      },
      { onConflict: "completion_id,guest_id" }
    );
    if (error) {
      return NextResponse.json(
        { error: "Mise à jour impossible." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, value: target });
}
