
-- Remove predictions from realtime to prevent broadcasting other users' predictions
ALTER PUBLICATION supabase_realtime DROP TABLE public.copaepica_predictions;

-- Explicit restrictive deny for client-side writes on copaepica_user_roles
CREATE POLICY "copaepica_user_roles_deny_insert" ON public.copaepica_user_roles
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "copaepica_user_roles_deny_update" ON public.copaepica_user_roles
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "copaepica_user_roles_deny_delete" ON public.copaepica_user_roles
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
