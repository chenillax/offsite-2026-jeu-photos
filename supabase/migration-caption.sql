-- ============================================================================
--  MIGRATION — Champ texte sur une soumission (ex. l'œuvre d'art imitée)
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> coller -> Run).
--  Ré-exécutable sans danger.
--
--  - challenges.caption_label : si renseigné, l'invité voit un champ texte avec
--    ce libellé lors de la soumission de ce défi.
--  - completions.caption      : le texte saisi par l'invité (visible côté admin).
--  Les deux tables sont déjà en lecture publique (sans restriction de colonnes),
--  donc aucun grant à ajouter ; les écritures passent par la route serveur.
-- ============================================================================

alter table public.challenges  add column if not exists caption_label text;
alter table public.completions add column if not exists caption       text;

-- Le défi « L'œuvre d'art » (position 7) demande de préciser l'œuvre imitée.
update public.challenges
   set caption_label = 'Quelle œuvre imites-tu ?'
 where position = 7;

-- ============================================================================
--  FIN.
-- ============================================================================
