-- Migration 004: Log de sincronização (usado pelo GitHub Actions)
CREATE TABLE IF NOT EXISTS copaepica_sync_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matches_updated INT NOT NULL DEFAULT 0,
  matches_inserted INT NOT NULL DEFAULT 0,
  predictions_backfilled INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT
);
