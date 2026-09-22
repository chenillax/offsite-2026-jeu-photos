// Sécurité de l'interface admin (côté serveur uniquement).
// Auth simple par mot de passe partagé : le cookie contient un hash du mot de
// passe (jamais le mot de passe en clair). Les routes admin vérifient ce cookie.
import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "mvs_admin";

// Jeton attendu = sha256 du mot de passe configuré côté serveur.
export function adminToken(): string {
  const pwd = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(pwd).digest("hex");
}

// La requête est-elle authentifiée comme admin ?
export function isAdminReq(req: NextRequest): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(cookie) && cookie === adminToken();
}
