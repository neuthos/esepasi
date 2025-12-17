ALTER TABLE bills
  ADD COLUMN deleted_at TIMESTAMP NULL,
  ADD COLUMN deleted_by UUID REFERENCES users(id),
  ADD COLUMN updated_by UUID REFERENCES users(id);

CREATE INDEX idx_bills_deleted_at ON bills(deleted_at);
