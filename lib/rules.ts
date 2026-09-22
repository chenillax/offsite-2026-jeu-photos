// Règles du jeu (source unique de vérité, utilisée côté serveur ET navigateur).

// Nombre de défis à réaliser pour terminer le jeu (sur le total proposé).
export const REQUIRED_CHALLENGES = 5;

// Seuil réellement requis, borné au nombre de défis existants (sécurité si la
// liste de défis venait à être plus courte que REQUIRED_CHALLENGES).
export function requiredToFinish(total: number): number {
  return Math.min(REQUIRED_CHALLENGES, total);
}
