"use client";

// Onglet "Classement".
//   - Gagnants (tout validé par Camille) d'abord, classés par HEURE DE SOUMISSION
//     COMPLÈTE (temps absolu où l'invité a soumis sa dernière photo). C'est ce
//     temps-là qui compte — pas la vitesse de validation de Camille.
//   - Puis les autres, par score potentiel (photos soumises) décroissant.
import type { Guest, Completion } from "@/lib/types";
import { formatClock } from "@/lib/format";
import { requiredToFinish } from "@/lib/rules";

type Row = {
  guest: Guest;
  doneCount: number;
  isWinner: boolean;
  submittedAllMs: number | null;
};

export default function Leaderboard({
  guests,
  completions,
  totalChallenges,
  meId,
}: {
  guests: Guest[];
  completions: Completion[];
  totalChallenges: number;
  meId: string;
}) {
  // Objectif pour terminer : 5 défis sur 7 (borné au nombre de défis).
  const need = requiredToFinish(totalChallenges);

  const rows: Row[] = guests
    .filter((g) => g.started_at) // seulement ceux qui ont commencé à jouer
    .map((g) => {
      // score potentiel = photos soumises (en attente ou validées, pas refusées)
      const doneCount = completions.filter(
        (c) => c.guest_id === g.id && c.status !== "rejected"
      ).length;
      const isWinner = Boolean(g.finished_at); // tout validé par Camille
      const submittedAllMs = g.submitted_all_at
        ? new Date(g.submitted_all_at).getTime()
        : null;
      return { guest: g, doneCount, isWinner, submittedAllMs };
    });

  rows.sort((a, b) => {
    // Gagnants d'abord, classés par heure de soumission complète (plus tôt = 1er).
    if (a.isWinner && b.isWinner) {
      return (a.submittedAllMs ?? Infinity) - (b.submittedAllMs ?? Infinity);
    }
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    // Non-gagnants : score potentiel décroissant, puis 1er à avoir tout soumis.
    if (b.doneCount !== a.doneCount) return b.doneCount - a.doneCount;
    return (a.submittedAllMs ?? Infinity) - (b.submittedAllMs ?? Infinity);
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="px-4 py-5">
      <h2 className="mb-4 text-center text-2xl font-semibold text-brown">
        Classement
      </h2>

      {rows.length === 0 ? (
        <p className="text-center text-brown-soft">
          Personne n&apos;a encore commencé. À toi de jouer !
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const isMe = r.guest.id === meId;
            // Podium = parmi les 3 premiers ET réellement gagnant (tout validé).
            const isPodium = r.isWinner && i < 3;
            const rowCls = isPodium
              ? "border-amber bg-amber/20"
              : isMe
                ? "border-amber bg-amber/10"
                : "border-sand bg-white";
            return (
              <li
                key={r.guest.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${rowCls}`}
              >
                <span
                  className={`w-8 text-center font-semibold ${
                    isPodium ? "text-2xl" : "text-lg text-brown-soft"
                  }`}
                >
                  {isPodium ? medals[i] : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brown">
                    {r.guest.name}
                    {isMe && (
                      <span className="ml-1 text-sm text-amber-dark">(toi)</span>
                    )}
                  </p>
                  <p className="text-sm text-brown-soft">
                    {r.isWinner
                      ? r.guest.submitted_all_at
                        ? `Tout soumis à ${formatClock(r.guest.submitted_all_at)}`
                        : "Gagnant·e"
                      : r.doneCount >= need
                        ? "Défis soumis · en attente de validation ⏳"
                        : `${Math.min(r.doneCount, need)} / ${need} défis`}
                  </p>
                </div>
                {isPodium ? (
                  <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-xs font-semibold text-white">
                    Gagnant·e
                  </span>
                ) : r.isWinner ? (
                  <span className="text-xl">🏁</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
