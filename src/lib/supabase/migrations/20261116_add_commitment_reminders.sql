-- Task #130: remind creators to work on their chosen commitment days.
-- Run this once in the Supabase SQL Editor. It only adds new tables.

BEGIN;

-- The days of the week a creator commits to working on content.
-- Days use JavaScript's numbering: 0 = Sunday ... 6 = Saturday.
-- time_zone is the creator's IANA time zone (e.g. "America/Phoenix"), so
-- "today" is worked out where the creator lives, not where the server is.
CREATE TABLE public.user_commitments (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    days smallint[] NOT NULL DEFAULT '{}'
        CHECK (days <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[]),
    time_zone text NOT NULL DEFAULT 'UTC',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row for each day the creator marked their work as done.
-- checkin_date is the creator's local calendar date.
CREATE TABLE public.reminder_checkins (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, checkin_date)
);

ALTER TABLE public.user_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_commitments_own_rows ON public.user_commitments
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY reminder_checkins_own_rows ON public.reminder_checkins
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

COMMIT;
