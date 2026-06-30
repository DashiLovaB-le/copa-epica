-- Migration 001: Schema base — tabelas, enums e funções
-- Aplicação: Bolão da Copa (PalpitesFC)

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. Enums
-- ============================================================
CREATE TYPE copaepica_app_role AS ENUM ('admin', 'user');

-- ============================================================
-- 3. Tabelas
-- ============================================================

-- 3.1. Profiles (usuários)
CREATE TABLE copaepica_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  points        INTEGER NOT NULL DEFAULT 0,
  correct_guesses INTEGER NOT NULL DEFAULT 0,
  incorrect_guesses INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2. Matches (partidas)
CREATE TABLE copaepica_matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a        TEXT NOT NULL,
  team_b        TEXT NOT NULL,
  match_date    TIMESTAMPTZ NOT NULL,
  round_number  INTEGER NOT NULL DEFAULT 1,
  result_a      INTEGER,
  result_b      INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3. Predictions (palpites dos usuários)
CREATE TABLE copaepica_predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id      UUID NOT NULL REFERENCES copaepica_matches(id) ON DELETE CASCADE,
  predicted_a   INTEGER NOT NULL,
  predicted_b   INTEGER NOT NULL,
  is_correct    BOOLEAN,
  points_earned INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cada usuário pode ter no máximo 1 palpite por partida
  UNIQUE (user_id, match_id)
);

-- 3.4. User Roles (controle de acesso)
CREATE TABLE copaepica_user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    copaepica_app_role NOT NULL DEFAULT 'user',

  UNIQUE (user_id, role)
);

-- ============================================================
-- 4. Função: copaepica_has_role
-- ============================================================
CREATE OR REPLACE FUNCTION copaepica_has_role(
  _role    copaepica_app_role,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM copaepica_user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- ============================================================
-- 5. Índices
-- ============================================================
CREATE INDEX idx_predictions_user_id    ON copaepica_predictions(user_id);
CREATE INDEX idx_predictions_match_id   ON copaepica_predictions(match_id);
CREATE INDEX idx_matches_date           ON copaepica_matches(match_date);
CREATE INDEX idx_matches_round          ON copaepica_matches(round_number);
CREATE INDEX idx_user_roles_user_id     ON copaepica_user_roles(user_id);
