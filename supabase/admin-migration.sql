-- ============================================================================
--  MIGRATION — Validation des photos par Camille
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> coller -> Run)
--  pour mettre à jour ta base existante. Ajoute le statut de validation aux
--  photos déjà soumises (toutes repassent "en attente").
-- ============================================================================

alter table public.completions
  add column if not exists status text not null default 'pending',
  add column if not exists ai_suggestion text;

-- Contrainte : statut limité à 3 valeurs.
alter table public.completions
  drop constraint if exists completions_status_check;
alter table public.completions
  add constraint completions_status_check
  check (status in ('pending', 'approved', 'rejected'));
