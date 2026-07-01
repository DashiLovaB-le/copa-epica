-- Migration 003: Pontuar palpites criados ou editados APÓS o resultado já estar no banco
-- ============================================================
-- Problema: O trigger trg_matches_auto_score só dispara quando
-- result_a/result_b de uma partida são atualizados. Se um palpite
-- for criado (INSERT) ou editado (UPDATE) DEPOIS do resultado já
-- estar definido na partida, ele nunca é pontuado.
--
-- Solução: Triggers AFTER INSERT e AFTER UPDATE que verificam se
-- a partida já tem resultado e já pontuam na hora.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_score_prediction_on_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result_a INTEGER;
  _result_b INTEGER;
BEGIN
  -- Pega o resultado da partida (se existir)
  SELECT m.result_a, m.result_b INTO _result_a, _result_b
  FROM copaepica_matches m
  WHERE m.id = NEW.match_id;

  -- Só pontua se ambos os resultados já foram definidos
  IF _result_a IS NOT NULL AND _result_b IS NOT NULL THEN
    UPDATE copaepica_predictions
    SET
      is_correct    = (NEW.predicted_a = _result_a AND NEW.predicted_b = _result_b),
      points_earned = CASE
                        WHEN NEW.predicted_a = _result_a AND NEW.predicted_b = _result_b THEN 10
                        ELSE 0
                      END
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_predictions_auto_score_on_insert
  AFTER INSERT ON copaepica_predictions
  FOR EACH ROW
  EXECUTE FUNCTION auto_score_prediction_on_upsert();

CREATE TRIGGER trg_predictions_auto_score_on_update
  AFTER UPDATE OF predicted_a, predicted_b ON copaepica_predictions
  FOR EACH ROW
  WHEN (OLD.predicted_a IS DISTINCT FROM NEW.predicted_a OR OLD.predicted_b IS DISTINCT FROM NEW.predicted_b)
  EXECUTE FUNCTION auto_score_prediction_on_upsert();

-- ============================================================
-- Backfill: Pontuar palpites existentes que ficaram sem pontuação
-- porque foram criados DEPOIS do resultado já estar na partida.
-- ============================================================
UPDATE copaepica_predictions p
SET
  is_correct    = (p.predicted_a = m.result_a AND p.predicted_b = m.result_b),
  points_earned = CASE
                    WHEN p.predicted_a = m.result_a AND p.predicted_b = m.result_b THEN 10
                    ELSE 0
                  END
FROM copaepica_matches m
WHERE p.match_id = m.id
  AND m.result_a IS NOT NULL
  AND m.result_b IS NOT NULL
  AND p.is_correct IS NULL;
