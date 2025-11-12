-- Add raw_data column to existing trends table
ALTER TABLE trends ADD COLUMN IF NOT EXISTS raw_data jsonb;

-- Create polymarket_markets table
CREATE TABLE IF NOT EXISTS polymarket_markets (
    id TEXT PRIMARY KEY, -- Market ID from Polymarket API
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    question TEXT NOT NULL,
    description TEXT,
    volume NUMERIC DEFAULT 0,
    liquidity NUMERIC DEFAULT 0,
    current_odds NUMERIC,
    end_date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    slug TEXT,
    market_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for polymarket_markets
CREATE INDEX IF NOT EXISTS idx_polymarket_updated_at ON polymarket_markets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_volume ON polymarket_markets(volume DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_category ON polymarket_markets(category);
CREATE INDEX IF NOT EXISTS idx_polymarket_end_date ON polymarket_markets(end_date);

-- Add trigger for updated_at on polymarket_markets
CREATE TRIGGER update_polymarket_markets_updated_at
    BEFORE UPDATE ON polymarket_markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: analyses table will serve as creative_generations
-- Foreign keys to both trends and polymarket_markets will be handled in application logic
-- since analyses.trend_id already exists for trends, we'll use raw_data jsonb to store market references
