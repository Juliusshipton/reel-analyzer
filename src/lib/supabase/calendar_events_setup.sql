-- #146 Add Data Persistence (story #122 Calendar for Scheduling Content Creation)
--
-- Run this once in the Supabase SQL editor. It is kept separate from schema.sql
-- so re-running schema.sql on an existing project does not fail on this table.

CREATE TABLE public.calendar_events (
                                        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                                        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                                        title varchar NOT NULL,
                                        description varchar,
                                        event_date timestamptz NOT NULL,
                                        created_at timestamptz DEFAULT now()
);

-- Every read filters by owner and sorts by date.
CREATE INDEX calendar_events_user_date_idx
    ON public.calendar_events (user_id, event_date);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_events_own_rows ON public.calendar_events
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

COMMIT;
