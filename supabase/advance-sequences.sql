CREATE OR REPLACE FUNCTION public.advance_cms_identity_sequences()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  table_name text;
  sequence_name text;
  current_max bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'events',
    'posts',
    'projects',
    'gallery',
    'submissions'
  ]
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM public.%I', table_name)
      INTO current_max;
    sequence_name := pg_get_serial_sequence(format('public.%I', table_name), 'id');
    IF sequence_name IS NOT NULL THEN
      IF current_max = 0 THEN
        PERFORM setval(sequence_name, 1, false);
      ELSE
        PERFORM setval(sequence_name, current_max, true);
      END IF;
    END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.advance_cms_identity_sequences() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_cms_identity_sequences() TO service_role;
