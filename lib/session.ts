// Mémorise dans le navigateur quel invité est connecté, pour ne pas avoir à se
// ré-authentifier à chaque ouverture de l'app.
import type { Guest } from "./types";

const KEY = "mariage-jeu:guest";

export function saveSession(guest: Guest): void {
  localStorage.setItem(KEY, JSON.stringify(guest));
}

export function loadSession(): Guest | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Guest;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
