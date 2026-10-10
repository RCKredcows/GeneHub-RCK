-- =====================================================
-- SIRE IMAGES, SCOPED PER WORKSPACE
--
-- The sire-images bucket was created by hand in production and never by a
-- migration, so the dev project and a fresh local stack had no bucket at all.
-- Production's four policies check only the bucket name:
--
--   "Allow public reads"            SELECT  public
--   "Allow authenticated uploads"   INSERT  authenticated
--   "Allow authenticated updates"   UPDATE  authenticated
--   "Allow authenticated deletes"   DELETE  authenticated
--
-- so any signed-in user can overwrite or delete any workspace's images. With
-- one workspace that was harmless; once signup is open it is not.
--
-- This follows 019's logos. Reads stay public, as today: sire pages and
-- printed reports use the public URL, and nothing secret goes in here. Every
-- write must land in a folder named for the caller's own workspace, and the
-- workspace must be allowed to write at all, so a lapsed workspace is
-- read-only here as everywhere else (015). Any member may write, matching who
-- may edit a sire.
--
-- That check cannot call tenant_may_write(uuid) directly: 017 revoked it from
-- authenticated on purpose, because it answers for any workspace id. A policy
-- calling it fails with "permission denied" -- and since Postgres evaluates
-- every INSERT policy on storage.objects together, that error breaks every
-- upload in every bucket, logos included. current_tenant_may_write() below
-- answers only for the caller's own workspace, as current_tenant_id() does.
--
-- Existing files sit at the bucket root. scripts/move-sire-images.mjs moves
-- them into RCK's folder and rewrites sires.image_url to match; it runs right
-- after this migration in the production window. Until it does, root files
-- stay readable but no user can change them.
--
-- The limits fit every file in production (queried 2026-10-09: jpeg, webp,
-- png, gif and avif, the largest 1.72 MB). They apply to new uploads only.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sire-images',
    'sire-images',
    true,
    5242880,   -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- THE CALLER'S OWN WRITE PERMISSION
-- =====================================================

CREATE OR REPLACE FUNCTION public.current_tenant_may_write()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT public.tenant_may_write(public.current_tenant_id());
$function$;

COMMENT ON FUNCTION public.current_tenant_may_write() IS
    'Whether the caller''s own workspace may still be written to. No argument, so it cannot be asked about anyone else''s.';

-- Supabase grants new functions to anon and authenticated directly, so revoking
-- from PUBLIC alone leaves them in place (012). Only a signed-in user needs it.
REVOKE ALL ON FUNCTION public.current_tenant_may_write() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_may_write() TO authenticated;

-- =====================================================
-- RETIRE THE HAND-MADE POLICIES
--
-- IF EXISTS, so this is a no-op where they never existed (dev, local).
-- =====================================================

DROP POLICY IF EXISTS "Allow public reads"          ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- =====================================================
-- POLICIES
-- =====================================================

DROP POLICY IF EXISTS sire_images_read ON storage.objects;
CREATE POLICY sire_images_read ON storage.objects
    FOR SELECT
    USING (bucket_id = 'sire-images');

-- The first path segment must be the caller's own tenant.
DROP POLICY IF EXISTS sire_images_write ON storage.objects;
CREATE POLICY sire_images_write ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'sire-images'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND public.current_tenant_may_write()
    );

DROP POLICY IF EXISTS sire_images_update ON storage.objects;
CREATE POLICY sire_images_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'sire-images'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND public.current_tenant_may_write()
    )
    WITH CHECK (
        bucket_id = 'sire-images'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND public.current_tenant_may_write()
    );

DROP POLICY IF EXISTS sire_images_delete ON storage.objects;
CREATE POLICY sire_images_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'sire-images'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND public.current_tenant_may_write()
    );
