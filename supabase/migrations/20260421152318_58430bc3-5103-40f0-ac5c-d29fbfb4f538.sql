
DROP POLICY IF EXISTS "Authenticated insert email log" ON public.email_log;
CREATE POLICY "Authenticated insert email log"
  ON public.email_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
