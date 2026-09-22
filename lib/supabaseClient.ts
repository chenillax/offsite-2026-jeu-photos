// Client Supabase pour le NAVIGATEUR (lecture seule + temps réel + upload photo).
// Utilise la clé "anon" (publique) — il ne peut rien écrire dans les tables
// grâce aux règles de sécurité (RLS) définies dans supabase/schema.sql.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. Crée un fichier .env.local " +
      "(voir .env.local.example)."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
