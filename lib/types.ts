// Types partagés dans toute l'app, calqués sur les tables Supabase.

export type Guest = {
  id: string;
  name: string;
  started_at: string | null;
  submitted_all_at: string | null; // heure (absolue) où l'invité a tout soumis → rang
  finished_at: string | null; // posé quand Camille a tout validé → statut gagnant
};

export type Challenge = {
  id: string;
  position: number;
  title: string;
  description: string;
  // Si renseigné, l'invité voit un champ texte avec ce libellé (ex. l'œuvre
  // d'art imitée) ; sinon pas de champ.
  caption_label: string | null;
};

// Statut de validation d'une photo par Camille.
export type CompletionStatus = "pending" | "approved" | "rejected";

export type Completion = {
  id: string;
  guest_id: string;
  challenge_id: string;
  photo_url: string;
  status: CompletionStatus;
  caption: string | null; // texte libre saisi par l'invité (ex. l'œuvre imitée)
  created_at: string;
};

// Réaction (👍 / 👎) d'un invité sur une photo publiée.
export type ReactionValue = "like" | "dislike";

// Compteurs de réactions pour une photo.
export type ReactionCounts = { like: number; dislike: number };
