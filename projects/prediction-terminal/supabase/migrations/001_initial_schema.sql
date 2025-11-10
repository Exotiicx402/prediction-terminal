-- Create enum for source types
CREATE TYPE source_type AS ENUM ('reddit', 'x', 'web');

-- Create enum for trend status
CREATE TYPE trend_status AS ENUM ('pending', 'analyzing', 'analyzed', 'alerted', 'dismissed');

-- Create enum for market potential
CREATE TYPE market_potential AS ENUM ('high', 'medium', 'low', 'none');

-- Trends table
CREATE TABLE trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source source_type NOT NULL,
    source_id TEXT NOT NULL, -- Original ID from the source platform
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    author TEXT,
    engagement_score INTEGER DEFAULT 0, -- upvotes, likes, etc.
    velocity_score DECIMAL, -- Rate of engagement growth
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status trend_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, source_id)
);

-- Analysis table (AI-generated insights)
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
    market_potential market_potential NOT NULL,
    confidence_score DECIMAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    summary TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    suggested_markets JSONB, -- Array of suggested market structures
    keywords TEXT[],
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table (Slack notifications sent)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_id UUID NOT NULL REFERENCES trends(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    slack_channel TEXT NOT NULL,
    slack_timestamp TEXT, -- Slack message timestamp for threading
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Source metadata table (track API usage and health)
CREATE TABLE source_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source source_type NOT NULL UNIQUE,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    last_scan_status TEXT,
    trends_found INTEGER DEFAULT 0,
    api_calls_today INTEGER DEFAULT 0,
    api_limit_daily INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial source metadata
INSERT INTO source_metadata (source, api_limit_daily) VALUES
    ('reddit', 1000),
    ('x', 500),
    ('web', 1000);

-- Indexes for performance
CREATE INDEX idx_trends_status ON trends(status);
CREATE INDEX idx_trends_source ON trends(source);
CREATE INDEX idx_trends_detected_at ON trends(detected_at DESC);
CREATE INDEX idx_trends_engagement ON trends(engagement_score DESC);
CREATE INDEX idx_analyses_trend_id ON analyses(trend_id);
CREATE INDEX idx_analyses_market_potential ON analyses(market_potential);
CREATE INDEX idx_alerts_trend_id ON alerts(trend_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trends_updated_at
    BEFORE UPDATE ON trends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_metadata_updated_at
    BEFORE UPDATE ON source_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for dashboard: recent high-potential trends
CREATE VIEW high_potential_trends AS
SELECT 
    t.id,
    t.source,
    t.title,
    t.url,
    t.engagement_score,
    t.detected_at,
    a.market_potential,
    a.confidence_score,
    a.summary,
    a.suggested_markets,
    al.sent_at as alerted_at
FROM trends t
INNER JOIN analyses a ON t.id = a.trend_id
LEFT JOIN alerts al ON t.id = al.trend_id
WHERE a.market_potential IN ('high', 'medium')
ORDER BY t.detected_at DESC, a.confidence_score DESC;
