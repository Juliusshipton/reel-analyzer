BEGIN;

CREATE TABLE public.user_surveys (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    weekly_hours numeric NOT NULL CHECK (weekly_hours >= 0),
    platforms text[] NOT NULL CHECK (cardinality(platforms) > 0),
    completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_surveys_own_rows ON public.user_surveys
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

COMMIT;
