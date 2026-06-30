-- Migration 002: Triggers e RLS Policies

-- ============================================================
-- 1. Trigger: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON copaepica_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON copaepica_matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_predictions_updated_at
  BEFORE UPDATE ON copaepica_predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. Trigger: criar profile automaticamente no cadastro
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.copaepica_profiles (id, display_name, points, correct_guesses, incorrect_guesses)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    0, 0, 0
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. Trigger: atualizar profile stats quando palpite for modificado
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE copaepica_profiles
  SET
    correct_guesses   = (SELECT COUNT(*) FROM copaepica_predictions WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND is_correct = true),
    incorrect_guesses = (SELECT COUNT(*) FROM copaepica_predictions WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND is_correct = false),
    points            = (SELECT COALESCE(SUM(points_earned), 0) FROM copaepica_predictions WHERE user_id = COALESCE(NEW.user_id, OLD.user_id))
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_predictions_refresh_profile
  AFTER INSERT OR UPDATE OR DELETE ON copaepica_predictions
  FOR EACH ROW
  EXECUTE FUNCTION refresh_profile_stats();

-- ============================================================
-- 4. Trigger: pontuar palpites automaticamente ao atualizar resultado
-- ============================================================
CREATE OR REPLACE FUNCTION auto_score_predictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só pontua se ambos os resultados foram definidos
  IF NEW.result_a IS NOT NULL AND NEW.result_b IS NOT NULL THEN
    UPDATE copaepica_predictions
    SET
      is_correct    = (predicted_a = NEW.result_a AND predicted_b = NEW.result_b),
      points_earned = CASE
                        WHEN predicted_a = NEW.result_a AND predicted_b = NEW.result_b THEN 10
                        ELSE 0
                      END
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_matches_auto_score
  AFTER INSERT OR UPDATE OF result_a, result_b ON copaepica_matches
  FOR EACH ROW
  WHEN (NEW.result_a IS NOT NULL AND NEW.result_b IS NOT NULL)
  EXECUTE FUNCTION auto_score_predictions();

-- ============================================================
-- 5. RLS (Row Level Security)
-- ============================================================

-- 5.1. Profiles
ALTER TABLE copaepica_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles são visíveis para todos"
  ON copaepica_profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuário pode inserir próprio profile"
  ON copaepica_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Usuário pode alterar próprio profile"
  ON copaepica_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5.2. Matches
ALTER TABLE copaepica_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches são visíveis para todos"
  ON copaepica_matches FOR SELECT
  USING (true);

CREATE POLICY "Apenas admin pode inserir matches"
  ON copaepica_matches FOR INSERT
  WITH CHECK (copaepica_has_role('admin', auth.uid()));

CREATE POLICY "Apenas admin pode alterar matches"
  ON copaepica_matches FOR UPDATE
  USING (copaepica_has_role('admin', auth.uid()));

CREATE POLICY "Apenas admin pode deletar matches"
  ON copaepica_matches FOR DELETE
  USING (copaepica_has_role('admin', auth.uid()));

-- 5.3. Predictions
ALTER TABLE copaepica_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions são visíveis para todos"
  ON copaepica_predictions FOR SELECT
  USING (true);

CREATE POLICY "Usuário pode inserir próprios palpites"
  ON copaepica_predictions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário pode alterar próprios palpites"
  ON copaepica_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário pode deletar próprios palpites"
  ON copaepica_predictions FOR DELETE
  USING (user_id = auth.uid());

-- 5.4. User Roles
ALTER TABLE copaepica_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles são visíveis para todos"
  ON copaepica_user_roles FOR SELECT
  USING (true);

CREATE POLICY "Apenas admin pode gerenciar roles"
  ON copaepica_user_roles FOR INSERT
  WITH CHECK (copaepica_has_role('admin', auth.uid()));

CREATE POLICY "Apenas admin pode alterar roles"
  ON copaepica_user_roles FOR UPDATE
  USING (copaepica_has_role('admin', auth.uid()));

CREATE POLICY "Apenas admin pode deletar roles"
  ON copaepica_user_roles FOR DELETE
  USING (copaepica_has_role('admin', auth.uid()));
