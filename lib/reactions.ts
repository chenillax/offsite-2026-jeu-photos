// Logique (pure) des réactions 👍 / 👎. Isolée ici pour être testable sans
// réseau ni base de données — partagée entre la route API (serveur) et l'UI.
import type { ReactionValue, ReactionCounts } from "./types";

// Décide le nouvel état quand on clique `clicked` alors que la réaction
// courante de l'invité est `current` :
//   - re-cliquer la même réaction l'annule (retour à null) ;
//   - cliquer l'autre réaction bascule dessus ;
//   - sans réaction préalable, on pose `clicked`.
export function nextReaction(
  current: ReactionValue | null,
  clicked: ReactionValue
): ReactionValue | null {
  return current === clicked ? null : clicked;
}

// Agrège une liste de réactions en compteurs { like, dislike } par photo.
export function countByCompletion(
  reactions: { completion_id: string; value: ReactionValue }[]
): Map<string, ReactionCounts> {
  const counts = new Map<string, ReactionCounts>();
  for (const r of reactions) {
    const c = counts.get(r.completion_id) ?? { like: 0, dislike: 0 };
    if (r.value === "like") c.like++;
    else if (r.value === "dislike") c.dislike++;
    counts.set(r.completion_id, c);
  }
  return counts;
}

// Listes des NOMS qui ont 👍 / 👎 chaque photo (phase 2). `nameOf` résout un
// guest_id en nom affichable.
export function namesByCompletion(
  reactions: { completion_id: string; guest_id: string; value: ReactionValue }[],
  nameOf: (guestId: string) => string
): Map<string, { like: string[]; dislike: string[] }> {
  const names = new Map<string, { like: string[]; dislike: string[] }>();
  for (const r of reactions) {
    const e = names.get(r.completion_id) ?? { like: [], dislike: [] };
    const name = nameOf(r.guest_id);
    if (r.value === "like") e.like.push(name);
    else if (r.value === "dislike") e.dislike.push(name);
    names.set(r.completion_id, e);
  }
  return names;
}
