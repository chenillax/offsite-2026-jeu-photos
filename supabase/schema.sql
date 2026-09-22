-- ============================================================================
--  SCHÉMA DE LA BASE DE DONNÉES — Jeu du mariage « Vœux Solaires »
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase :
--    Dashboard Supabase  ->  SQL Editor  ->  New query  ->  coller tout ce
--    fichier  ->  Run.
--  (Ce script est ré-exécutable sans danger : il nettoie avant de recréer.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- Les invités : nom affiché + question/réponse secrète + chrono.
create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  name             text not null,
  started_at       timestamptz,       -- posé à la 1re arrivée dans le jeu
  submitted_all_at timestamptz,       -- posé quand l'invité a soumis TOUS ses défis (= son rang)
  finished_at      timestamptz,       -- posé quand Camille a TOUT validé (= statut gagnant)
  created_at       timestamptz not null default now()
);

-- Les défis à réaliser (5 ou 6).
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  position    int  not null,             -- ordre d'affichage
  title       text not null,
  description text not null,
  caption_label text,                    -- si renseigné : champ texte côté invité
  created_at  timestamptz not null default now()
);

-- Un défi validé par un invité (avec sa photo preuve).
create table if not exists public.completions (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null references public.guests(id)     on delete cascade,
  challenge_id  uuid not null references public.challenges(id) on delete cascade,
  photo_url     text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  ai_suggestion text,                    -- suggestion IA pour aider Camille (optionnel)
  caption       text,                    -- texte libre de l'invité (ex. œuvre imitée)
  created_at    timestamptz not null default now(),
  unique (guest_id, challenge_id)        -- une photo par défi et par invité
);

-- ----------------------------------------------------------------------------
-- 2. SÉCURITÉ (Row Level Security)
--    On active RLS partout. Le navigateur (clé "anon") ne peut QUE LIRE.
--    Toutes les écritures passent par nos routes API serveur (clé service_role
--    qui contourne RLS) -> limite la triche et protège les réponses secrètes.
-- ----------------------------------------------------------------------------

alter table public.guests      enable row level security;
alter table public.challenges  enable row level security;
alter table public.completions enable row level security;

-- Lecture publique des défis.
drop policy if exists "read challenges" on public.challenges;
create policy "read challenges" on public.challenges
  for select to anon, authenticated using (true);

-- Lecture publique des défis validés (pour le classement + le feed live).
drop policy if exists "read completions" on public.completions;
create policy "read completions" on public.completions
  for select to anon, authenticated using (true);

-- Lecture publique des invités (les lignes). Les COLONNES sensibles sont
-- bloquées juste en dessous par les grants de colonnes.
drop policy if exists "read guests" on public.guests;
create policy "read guests" on public.guests
  for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- 3. COLONNES PUBLIQUES (grants au niveau colonne)
--    Le navigateur ne peut lire que les colonnes utiles au jeu (pas created_at).
-- ----------------------------------------------------------------------------

revoke select on public.guests from anon, authenticated;
grant  select (id, name, started_at, submitted_all_at, finished_at) on public.guests to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. TEMPS RÉEL
--    On expose completions + guests au système temps réel de Supabase pour que
--    le classement et le feed se mettent à jour tout seuls. (Le temps réel
--    respecte les grants de colonnes : secret_answer ne fuite pas.)
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.completions;
alter publication supabase_realtime add table public.guests;

-- ----------------------------------------------------------------------------
-- 4 bis. RÉACTIONS 👍 / 👎 sur les photos (voir migration-reactions*.sql)
--    Phase 2 active : on expose aussi guest_id → l'app affiche les noms de
--    ceux qui réagissent. (Pour revenir à l'anonymat, retirer guest_id du
--    grant ci-dessous.)
-- ----------------------------------------------------------------------------

create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  completion_id uuid not null references public.completions(id) on delete cascade,
  guest_id      uuid not null references public.guests(id)      on delete cascade,
  value         text not null check (value in ('like', 'dislike')),
  created_at    timestamptz not null default now(),
  unique (completion_id, guest_id)
);

create index if not exists reactions_completion_idx
  on public.reactions (completion_id);

alter table public.reactions enable row level security;

drop policy if exists "read reactions" on public.reactions;
create policy "read reactions" on public.reactions
  for select to anon, authenticated using (true);

revoke select on public.reactions from anon, authenticated;
grant  select (id, completion_id, guest_id, value, created_at)
  on public.reactions to anon, authenticated;

alter publication supabase_realtime add table public.reactions;

-- ----------------------------------------------------------------------------
-- 5. STOCKAGE DES PHOTOS (bucket "photos")
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- N'importe qui peut envoyer une photo dans le bucket "photos"...
drop policy if exists "upload photos" on storage.objects;
create policy "upload photos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos');

-- ...et tout le monde peut les lire (le bucket est public de toute façon).
drop policy if exists "read photos" on storage.objects;
create policy "read photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos');

-- ============================================================================
--  FIN. Pense ensuite à exécuter seed.sql pour ajouter invités + défis.
-- ============================================================================
