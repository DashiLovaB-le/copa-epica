-- Remove funcoes e triggers residuais do CarControl que quebram o signup
-- Elas interceptam INSERT em auth.users e tentam criar registros no carcontrol_user

DO $$
DECLARE
  v_tgname TEXT;
  v_func_oid OID;
  v_proname TEXT;
  v_nspname TEXT;
BEGIN
  -- Encontra triggers em auth.users cuja funcao contem referencia a carcontrol_user
  FOR v_tgname, v_func_oid IN
    SELECT tgname, tgfoid
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
  LOOP
    SELECT p.proname, n.nspname INTO v_proname, v_nspname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.oid = v_func_oid
      AND p.prosrc ILIKE '%carcontrol_user%';

    IF FOUND THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', v_tgname);
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', v_nspname, v_proname);
      RAISE NOTICE 'Removido trigger: %, funcao: %.%', v_tgname, v_nspname, v_proname;
    END IF;
  END LOOP;
END;
$$;
