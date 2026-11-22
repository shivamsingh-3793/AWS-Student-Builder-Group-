ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_status_check'
      AND conrelid = 'public.submissions'::regclass
  ) THEN
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_status_check
      CHECK (status IN ('new', 'read', 'reviewed'));
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS submissions_status_recent_idx
  ON public.submissions (status, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.admin_list_submissions(
  p_kind text,
  p_status text,
  p_search text,
  p_sort text,
  p_limit integer,
  p_offset integer
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $function$
  WITH matching_ids AS (
    SELECT s.id, s.created_at
    FROM public.submissions AS s
    LEFT JOIN public.events AS e ON e.id = s.event_id
    WHERE (p_kind IS NULL OR s.kind = p_kind)
      AND (p_status IS NULL OR s.status = p_status)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR strpos(lower(coalesce(s.name, '')), lower(p_search)) > 0
        OR strpos(lower(coalesce(s.email, '')), lower(p_search)) > 0
        OR strpos(lower(coalesce(s.role, '')), lower(p_search)) > 0
        OR strpos(lower(coalesce(s.track, '')), lower(p_search)) > 0
        OR strpos(lower(coalesce(s.message, '')), lower(p_search)) > 0
        OR strpos(lower(coalesce(e.title, '')), lower(p_search)) > 0
      )
  ),
  page_ids AS (
    SELECT *
    FROM matching_ids
    ORDER BY
      CASE WHEN p_sort = 'oldest' THEN created_at END ASC,
      CASE WHEN p_sort <> 'oldest' THEN created_at END DESC,
      CASE WHEN p_sort = 'oldest' THEN id END ASC,
      CASE WHEN p_sort <> 'oldest' THEN id END DESC
    LIMIT least(greatest(coalesce(p_limit, 25), 1), 100)
    OFFSET greatest(coalesce(p_offset, 0), 0)
  ),
  page_submissions AS (
    SELECT
      s.id,
      s.kind,
      s.name,
      s.email,
      s.role,
      s.track,
      s.message,
      s.event_id,
      s.status,
      s.created_at,
      e.title AS event_title
    FROM page_ids AS p
    JOIN public.submissions AS s ON s.id = p.id
    LEFT JOIN public.events AS e ON e.id = s.event_id
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM matching_ids),
    'submissions', coalesce(
      (
        SELECT jsonb_agg(
          to_jsonb(page_submissions)
          ORDER BY
            CASE WHEN p_sort = 'oldest' THEN created_at END ASC,
            CASE WHEN p_sort <> 'oldest' THEN created_at END DESC,
            CASE WHEN p_sort = 'oldest' THEN id END ASC,
            CASE WHEN p_sort <> 'oldest' THEN id END DESC
        )
        FROM page_submissions
      ),
      '[]'::jsonb
    )
  )
$function$;

REVOKE ALL ON FUNCTION public.admin_list_submissions(text, text, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_submissions(text, text, text, text, integer, integer)
  TO service_role;
NOTIFY pgrst, 'reload schema';
