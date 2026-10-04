CREATE TABLE IF NOT EXISTS pages (
  doc_id TEXT NOT NULL,
  page   INT  NOT NULL,
  text   TEXT NOT NULL,
  tsv    TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  PRIMARY KEY (doc_id, page)
);
CREATE INDEX IF NOT EXISTS pages_tsv_idx ON pages USING GIN (tsv);
