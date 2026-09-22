-- ============================================================================
--  MIGRATION — Réactions PHASE 2 : afficher les noms de ceux qui réagissent
-- ----------------------------------------------------------------------------
--  À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> coller -> Run).
--  Prérequis : migration-reactions.sql (phase 1) déjà appliquée.
--
--  On ouvre la lecture de la colonne guest_id au navigateur. Combinée à la
--  liste des invités (déjà publique), l'app peut afficher QUI a 👍 / 👎.
-- ============================================================================

grant select (guest_id) on public.reactions to anon, authenticated;

-- ============================================================================
--  FIN.  (Pour revenir à l'anonymat : revoke select (guest_id) on
--   public.reactions from anon, authenticated;)
-- ============================================================================
