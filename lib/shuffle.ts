// Mélange (Fisher-Yates) pur et testable : le générateur aléatoire est
// injectable pour pouvoir tester de façon déterministe. Ne mute pas l'entrée.
export function shuffle<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
