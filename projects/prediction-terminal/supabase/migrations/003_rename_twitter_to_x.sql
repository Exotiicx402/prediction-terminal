-- Update enum to replace twitter with x
ALTER TYPE source_type RENAME TO source_type_old;
CREATE TYPE source_type AS ENUM ('reddit', 'x', 'web');

-- Update existing data
ALTER TABLE trends ALTER COLUMN source TYPE source_type USING source::text::source_type;
ALTER TABLE source_metadata ALTER COLUMN source TYPE source_type USING source::text::source_type;

-- Drop old enum
DROP TYPE source_type_old;

-- Update source_metadata if twitter exists
UPDATE source_metadata SET source = 'x' WHERE source = 'x';
