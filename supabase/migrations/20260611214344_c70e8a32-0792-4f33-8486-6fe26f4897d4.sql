
-- Remove predictions from realtime to prevent broadcasting other users' predictions
ALTER PUBLICATION supabase_realtime DROP TABLE public.predictions;

-- Explicit restrictive deny for client-side writes on user_roles
CREATE POLICY "Deny insert to user_roles" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Deny update to user_roles" ON public.user_roles
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny delete to user_roles" ON public.user_roles
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);
