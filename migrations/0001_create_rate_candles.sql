CREATE TABLE rate_candles (
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  bucket_start TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  ask REAL,
  source TEXT NOT NULL,
  PRIMARY KEY (symbol, interval, bucket_start)
);

CREATE INDEX idx_rate_candles_range ON rate_candles(symbol, interval, bucket_start);
