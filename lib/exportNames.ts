// Logique (pure) de nommage des fichiers dans le ZIP d'export des photos.
// Isolée ici pour être testable sans réseau ni base de données.

// Rend un texte sûr pour un nom de fichier/dossier (pas de / \ : * ? " < > |).
export function safeName(name: string): string {
  return (
    name
      .replace(/[\/\\:*?"<>|]/g, "-") // caractères interdits
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "sans-nom"
  );
}

// Suffixe ajouté au nom selon le statut de validation de la photo.
export function statusSuffix(status: string): string {
  return status === "approved"
    ? ""
    : status === "rejected"
      ? " (refusée)"
      : " (en attente)";
}

// Construit le chemin d'une photo dans le ZIP :
//   "<Nom invité>/<position sur 2 chiffres>_<titre du défi><suffixe statut>.jpg"
export function zipEntryName(opts: {
  guestName?: string | null;
  position?: number | null;
  title?: string | null;
  status: string;
}): string {
  const guest = safeName(opts.guestName ?? "Invité inconnu");
  const pos =
    opts.position != null ? String(opts.position).padStart(2, "0") : "00";
  const title = safeName(opts.title ?? "Défi");
  return `${guest}/${pos}_${title}${statusSuffix(opts.status)}.jpg`;
}

// Garantit l'unicité d'un nom face aux noms déjà utilisés : insère " (n)" juste
// avant l'extension en cas de collision. Mute le Set `used`.
export function uniqueName(entry: string, used: Set<string>): string {
  if (!used.has(entry)) {
    used.add(entry);
    return entry;
  }
  const dot = entry.lastIndexOf(".");
  const base = dot === -1 ? entry : entry.slice(0, dot);
  const ext = dot === -1 ? "" : entry.slice(dot);
  let n = 2;
  let candidate = `${base} (${n})${ext}`;
  while (used.has(candidate)) {
    n++;
    candidate = `${base} (${n})${ext}`;
  }
  used.add(candidate);
  return candidate;
}
