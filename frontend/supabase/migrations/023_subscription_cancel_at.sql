-- =====================================================
-- SCHEDULED CANCELLATION
--
-- A customer who cancels from Stripe's billing page keeps their workspace
-- until the period they paid for runs out. Stripe reports that as `cancel_at`
-- on the subscription while the status stays `active`, so until now Settings
-- went on saying "Renews" for a subscription that never would.
--
-- `cancel_at` rather than `cancel_at_period_end`: Stripe's classic billing
-- mode sets both, its flexible mode sets only `cancel_at`, so this one column
-- is right in either. NULL means nothing is scheduled. The webhook keeps it
-- current, and clears it if the customer resumes before the date.
-- =====================================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tenants.cancel_at IS
    'When Stripe will end the subscription, if a cancellation is scheduled. NULL otherwise.';
