-- ============================================================================
--  MIGRATION — Réactions 👍 / 👎 sur les photos publiées
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> coller -> Run).
--  Ré-exécutable sans danger.
--
--  PHASE 1 (actuelle) : on affiche seulement le NOMBRE de 👍 / 👎. La colonne
--  guest_id est stockée (pour limiter à 1 réaction par personne et permettre de
--  changer d'avis) mais n'est PAS lisible par le navigateur → on ne révèle pas
--  qui a réagi.
--  PHASE 2 (plus tard) : pour afficher les noms, il suffira d'ajouter
--    grant select (guest_id) on public.reactions to anon, authenticated;
-- ============================================================================

create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  completion_id uuid not null references public.completions(id) on delete cascade,
  guest_id      uuid not null references public.guests(id)      on delete cascade,
  value         text not null check (value in ('like', 'dislike')),
  created_at    timestamptz not null default now(),
  unique (completion_id, guest_id)   -- une seule réaction par invité et par photo
);

-- Index pour agréger vite les compteurs par photo.
create index if not exists reactions_completion_idx
  on public.reactions (completion_id);

-- Sécurité : RLS activée. Le navigateur ne peut que LIRE (compteurs) ; toutes
-- les écritures passent par la route API serveur (clé service_role).
alter table public.reactions enable row level security;

drop policy if exists "read reactions" on public.reactions;
create policy "read reactions" on public.reactions
  for select to anon, authenticated using (true);

-- Colonnes publiques : surtout PAS guest_id en phase 1 (on cache qui réagit).
revoke select on public.reactions from anon, authenticated;
grant  select (id, completion_id, value, created_at)
  on public.reactions to anon, authenticated;

-- Temps réel : le mur de photos met à jour les compteurs tout seul.
-- (idempotent : on n'ajoute la table à la publication que si absente.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
end $$;

-- ============================================================================
--  FIN.
-- ============================================================================
