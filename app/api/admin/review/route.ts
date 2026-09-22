// POST /api/admin/review   body: { completionId, decision: "approve" | "reject" }
// Camille valide ou refuse une photo. On met à jour son statut, puis on
// recalcule si l'invité a terminé (assez de photos validées -> finished_at).
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminReq } from "@/lib/admin";
import { requiredToFinish } from "@/lib/rules";

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: { completionId?: string; decision?: "approve" | "reject" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { completionId, decision } = body;
  if (!completionId || (decision !== "approve" && decision !== "reject")) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const status = decision === "approve" ? "approved" : "rejected";

  const { data: updated, error } = await supabaseAdmin
    .from("completions")
    .update({ status })
    .eq("id", completionId)
    .select("guest_id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  }

  // Recalcule l'état de l'invité après cette décision.
  const guestId = updated.guest_id as string;
  const [{ count: total }, { count: approved }, { count: covered }, { data: g }] =
    await Promise.all([
      supabaseAdmin
        .from("challenges")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("completions")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", guestId)
        .eq("status", "approved"),
      supabaseAdmin
        .from("completions")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", guestId)
        .neq("status", "rejected"),
      supabaseAdmin
        .from("guests")
        .select("finished_at, submitted_all_at")
        .eq("id", guestId)
        .single(),
    ]);

  const need = requiredToFinish(total ?? 0);
  const enoughApproved = Boolean(total) && (approved ?? 0) >= need;
  const enoughCovered = Boolean(total) && (covered ?? 0) >= need;

  const patch: { finished_at?: string | null; submitted_all_at?: null } = {};
  // statut gagnant = assez de photos validées (5 sur 7)
  if (enoughApproved && !g?.finished_at) patch.finished_at = new Date().toISOString();
  else if (!enoughApproved && g?.finished_at) patch.finished_at = null;
  // un refus est repassé sous le seuil requis -> on annule l'heure de soumission
  if (!enoughCovered && g?.submitted_all_at) patch.submitted_all_at = null;

  if (Object.keys(patch).length > 0) {
    await supabaseAdmin.from("guests").update(patch).eq("id", guestId);
  }

  return NextResponse.json({ ok: true, status });
}
