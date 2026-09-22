-- ============================================================================
--  MIGRATION — Classement par heure de soumission complète (temps absolu)
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> coller -> Run).
--  Ajoute l'heure à laquelle un invité a soumis TOUS ses défis (= son rang),
--  indépendamment du moment où Camille valide.
-- ============================================================================

alter table public.guests
  add column if not exists submitted_all_at timestamptz;

-- Le navigateur doit pouvoir lire cette colonne (classement).
grant select (submitted_all_at) on public.guests to anon, authenticated;
