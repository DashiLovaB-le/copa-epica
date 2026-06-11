
ALTER FUNCTION public.copaepica_set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.copaepica_has_role(uuid, public.copaepica_app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copaepica_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copaepica_score_predictions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copaepica_set_updated_at() FROM PUBLIC, anon, authenticated;
