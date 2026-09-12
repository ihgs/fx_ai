CREATE TABLE analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  executed_at TEXT NOT NULL,
  method TEXT NOT NULL,
  direction TEXT NOT NULL,
  rationale TEXT NOT NULL,
  target_at TEXT NOT NULL,
  input_from TEXT NOT NULL,
  input_to TEXT NOT NULL,
  trigger TEXT NOT NULL
);

CREATE INDEX idx_analysis_results_executed_at ON analysis_results(executed_at);
