// Client Supabase pour le SERVEUR uniquement (routes API).
// Utilise la clé "service_role" qui contourne toutes les règles de sécurité :
// c'est elle qui vérifie les réponses secrètes et écrit dans la base.
//
// "server-only" fait planter le build si ce fichier était importé par erreur
// dans du code navigateur — la clé service_role ne doit JAMAIS fuiter.
import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Variables d'environnement Supabase serveur manquantes (NEXT_PUBLIC_SUPABASE_URL " +
      "et/ou SUPABASE_SERVICE_ROLE_KEY). Voir .env.local.example."
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
