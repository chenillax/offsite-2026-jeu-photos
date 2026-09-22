-- ============================================================================
--  DONNÉES DU JEU — invités + défis  (DONNÉES RÉELLES — mariage Marine & Clément)
-- ----------------------------------------------------------------------------
--  À exécuter dans Supabase : SQL Editor -> New query -> coller -> Run.
--  Le "truncate" réinitialise tout à chaque exécution.
-- ============================================================================

-- Nettoyage : on retire les anciennes colonnes "question secrète" si elles
-- existent encore (l'authentification par question a été supprimée).
alter table public.guests drop column if exists secret_question;
alter table public.guests drop column if exists secret_answer;

truncate public.completions, public.guests, public.challenges restart identity cascade;

-- ----------------------------------------------------------------------------
--  LES DÉFIS — "position" = ordre d'affichage.
-- ----------------------------------------------------------------------------
insert into public.challenges (position, title, description, caption_label) values
  (1, 'Un theodo',     '', null),
  (2, 'Un Bam',     '', null),
  (3, 'Un corpo',           '', null),
  (4, 'Selfie discret',          'Réussis un selfie avec les dirigeants dessus… sans qu''ils te voient !', null),
  (5, 'Poisson',         'XXX', null),
  (6, 'Dans des escaliers',   'Prends une photo dans les escaliers', null),
  (7, 'L''œuvre d''art',         'Prends une photo imitant une œuvre d''art', 'Quelle œuvre imites-tu ?');

-- ----------------------------------------------------------------------------
--  LES INVITÉS — juste un nom (l'invité se sélectionne dans la liste).
-- ----------------------------------------------------------------------------
insert into public.guests (name) values
  ('Equipe 1'),
  ('Equipe 2'),
  ('Equipe 3'),
  ('Equipe 4'),
  ('Equipe 5'),
  ('Equipe 6'),
  ('Equipe 7'),
  ('Equipe 8'),
  ('Equipe 9'),
  ('Equipe 10'),
  ('Equipe 11'),
  ('Equipe 12'),
  ('Equipe 13'),
  ('Equipe 14'),
  ('Equipe 15'),
  ('Equipe 16'),
  ('Equipe 17'),
  ('Equipe 18'),
  ('Equipe 19'),
  ('Test');

-- ============================================================================
--  143 invités · 7 défis
-- ============================================================================
