-- =====================================================
-- Drop the superseded search_genetic_inventory overload
--
-- Production carries two versions of this function:
--
--   (text, text, text, text, text, integer, integer)                 -- old
--   (text, text, text, text, text, text, integer, integer)           -- current
--
-- They coexist because CREATE OR REPLACE FUNCTION only replaces an identical
-- signature. Adding `status_filter` created a second function rather than
-- replacing the first, and nothing ever removed the original.
--
-- Two reasons this matters more than tidiness:
--
--   PostgREST resolves an RPC by the argument names it is given. A caller that
--   omits status_filter silently lands on the old overload, which has no such
--   filter and so returns checked-out inventory alongside stored. Wrong
--   answers, no error.
--
--   Calling it with a single named argument is ambiguous and Postgres refuses
--   outright -- which is how this was found, from a test that could not choose
--   between them.
--
-- The application always sends status_filter (src/api/geneticInventory.ts), so
-- it already resolves to the current version and is unaffected.
-- =====================================================

DO $$
BEGIN
    -- Never leave the table without a way to search it: the replacement has to
    -- exist before the old one goes.
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'search_genetic_inventory'
          AND pg_get_function_identity_arguments(p.oid) =
              'search_term text, owner_filter text, type_filter text, sex_filter text, ivf_filter text, status_filter text, page_limit integer, page_offset integer'
    ) THEN
        RAISE EXCEPTION 'the current search_genetic_inventory overload is missing'
            USING HINT = 'Refusing to drop the old one and leave nothing behind.';
    END IF;
END $$;

DROP FUNCTION IF EXISTS public.search_genetic_inventory(
    TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER
);
