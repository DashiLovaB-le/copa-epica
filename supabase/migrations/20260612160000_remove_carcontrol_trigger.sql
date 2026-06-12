-- Remove funcoes e triggers residuais do CarControl que quebram o signup
-- Elas interceptam INSERT em auth.users e tentam criar registros no carcontrol_user

DO $$
DECLARE
  v_tgname TEXT;
  v_proname TEXT;
  v_nspname TEXT;
BEGIN
  -- Encontra triggers em auth.users cuja funcao contem referencia a carcontrol_user
  FOR v_tgname, v_proname, v_nspname IN
    SELECT t.tgname, p.proname, n.nspname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace n ON p.pronamespace = n.nspname
    WHERE t.tgrelid = 'auth.users'::regclass
      AND NOT t.tgisinternal
      AND p.prosrc ILIKE '%carcontrol_user%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', v_tgname);
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', v_nspname, v_proname);
    RAISE NOTICE 'Removido trigger: %, funcao: %.%', v_tgname, v_nspname, v_proname;
  END LOOP;
END;
$$;
