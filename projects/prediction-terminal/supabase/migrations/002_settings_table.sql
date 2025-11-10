-- Create settings table for in-app configuration
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
    ('keywords_prediction', '["election", "vote", "poll", "forecast", "prediction", "odds", "betting", "trump", "biden", "senate", "inflation", "recession", "bitcoin", "crypto", "championship", "mvp", "ipo", "merger"]'::jsonb, 'Keywords that indicate prediction market potential'),
    ('keywords_exclusion', '["nsfw", "porn", "buy my", "subscribe to"]'::jsonb, 'Keywords to exclude from analysis'),
    ('threshold_reddit_upvotes', '50'::jsonb, 'Minimum upvotes for Reddit posts'),
    ('threshold_reddit_comments', '5'::jsonb, 'Minimum comments for Reddit posts'),
    ('threshold_reddit_ratio', '0.6'::jsonb, 'Minimum upvote ratio for Reddit posts'),
    ('threshold_x_likes', '500'::jsonb, 'Minimum likes for X posts'),
    ('threshold_x_retweets', '50'::jsonb, 'Minimum retweets for X posts'),
    ('x_monitor_accounts', '["breakingnews", "CNNBreaking", "BBCBreaking", "Reuters", "AP", "business", "polymarket", "elonmusk"]'::jsonb, 'X/Twitter accounts to monitor for trends');

-- Trigger to update updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
