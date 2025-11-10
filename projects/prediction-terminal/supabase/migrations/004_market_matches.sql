-- Table to store Polymarket market matches with trending content
CREATE TABLE market_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
    
    -- Polymarket market info
    market_id TEXT NOT NULL,
    market_slug TEXT NOT NULL,
    market_question TEXT NOT NULL,
    market_volume DECIMAL,
    market_liquidity DECIMAL,
    market_category TEXT,
    market_url TEXT,
    
    -- Match scoring
    match_score INTEGER NOT NULL DEFAULT 0,
    match_keywords TEXT[],
    
    -- Marketing potential
    ad_potential TEXT CHECK (ad_potential IN ('high', 'medium', 'low')),
    ad_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trend_id, market_id)
);

-- Index for fast lookups
CREATE INDEX idx_market_matches_trend_id ON market_matches(trend_id);
CREATE INDEX idx_market_matches_market_id ON market_matches(market_id);
CREATE INDEX idx_market_matches_score ON market_matches(match_score DESC);
CREATE INDEX idx_market_matches_ad_potential ON market_matches(ad_potential);

-- Trigger for updated_at
CREATE TRIGGER update_market_matches_updated_at
    BEFORE UPDATE ON market_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for ad opportunities (trends with matching markets)
CREATE VIEW ad_opportunities AS
SELECT 
    t.id as trend_id,
    t.source,
    t.title as trend_title,
    t.url as trend_url,
    t.engagement_score,
    t.detected_at,
    a.market_potential,
    a.confidence_score,
    a.summary,
    mm.market_id,
    mm.market_slug,
    mm.market_question,
    mm.market_volume,
    mm.market_liquidity,
    mm.match_score,
    mm.ad_potential,
    mm.market_url
FROM trends t
INNER JOIN analyses a ON t.id = a.trend_id
INNER JOIN market_matches mm ON t.id = mm.trend_id
WHERE t.status = 'analyzed'
ORDER BY mm.match_score DESC, t.engagement_score DESC;
