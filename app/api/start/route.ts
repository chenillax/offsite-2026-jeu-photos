// POST /api/start   body: { guestId }
// L'invité rejoint le jeu : on démarre son chrono (started_at) à la première
// fois et on renvoie ses infos.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  let body: { guestId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { guestId } = body;
  if (!guestId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { data: guest, error } = await supabaseAdmin
    .from("guests")
    .select("id, name, started_at, finished_at")
    .eq("id", guestId)
    .single();

  if (error || !guest) {
    return NextResponse.json({ error: "Invité introuvable." }, { status: 404 });
  }

  // Démarre le chrono à la première arrivée.
  let started_at = guest.started_at;
  if (!started_at) {
    started_at = new Date().toISOString();
    await supabaseAdmin
      .from("guests")
      .update({ started_at })
      .eq("id", guest.id);
  }

  return NextResponse.json({
    guest: {
      id: guest.id,
      name: guest.name,
      started_at,
      finished_at: guest.finished_at,
    },
  });
}
