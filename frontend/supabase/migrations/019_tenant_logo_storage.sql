-- =====================================================
-- LOGO UPLOADS
--
-- Branding took a URL, which is a developer's answer. A workspace needs to
-- upload an image file.
--
-- The bucket is public to read, deliberately: the logo appears on the sign-in
-- screen, which is rendered before anyone has a session. Nothing secret goes
-- in here -- only the mark a workspace wants shown to its own people.
--
-- Writes are a different matter. Every object lives under a folder named for
-- its tenant, and the policies below check that folder against the caller's
-- own membership. One workspace therefore cannot overwrite another's logo,
-- which is the failure mode a flat bucket would allow.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tenant-logos',
    'tenant-logos',
    true,
    2097152,   -- 2 MB: a logo that needs more is the wrong file
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- POLICIES
-- =====================================================

DROP POLICY IF EXISTS tenant_logos_read ON storage.objects;
CREATE POLICY tenant_logos_read ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tenant-logos');

-- The first path segment must be the caller's own tenant, and only someone
-- who manages the workspace may change how it looks.
DROP POLICY IF EXISTS tenant_logos_write ON storage.objects;
CREATE POLICY tenant_logos_write ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'tenant-logos'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid() AND e.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS tenant_logos_update ON storage.objects;
CREATE POLICY tenant_logos_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'tenant-logos'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid() AND e.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS tenant_logos_delete ON storage.objects;
CREATE POLICY tenant_logos_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'tenant-logos'
        AND (storage.foldername(name))[1] = public.current_tenant_id()::TEXT
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid() AND e.role IN ('owner', 'admin')
        )
    );
