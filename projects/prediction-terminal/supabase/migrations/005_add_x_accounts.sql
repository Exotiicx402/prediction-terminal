-- Add X accounts setting if it doesn't exist
INSERT INTO settings (key, value, description) VALUES
    ('x_monitor_accounts', '["breakingnews", "CNNBreaking", "BBCBreaking", "Reuters", "AP", "business", "polymarket", "elonmusk"]'::jsonb, 'X/Twitter accounts to monitor for trends')
ON CONFLICT (key) DO NOTHING;

-- Update existing twitter settings to x
UPDATE settings SET key = 'threshold_x_likes' WHERE key = 'threshold_twitter_likes';
UPDATE settings SET key = 'threshold_x_retweets' WHERE key = 'threshold_twitter_retweets';
