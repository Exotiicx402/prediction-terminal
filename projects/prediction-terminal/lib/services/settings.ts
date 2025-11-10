import { getServerSupabase } from '@/lib/supabase/client';

// Cache settings for performance
let settingsCache: Record<string, any> = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function getSettings(): Promise<Record<string, any>> {
  const now = Date.now();
  
  // Return cached settings if still fresh
  if (now - lastCacheUpdate < CACHE_DURATION && Object.keys(settingsCache).length > 0) {
    return settingsCache;
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) throw error;

    // Convert to key-value object
    settingsCache = {};
    data?.forEach(setting => {
      settingsCache[setting.key] = setting.value;
    });

    lastCacheUpdate = now;
    return settingsCache;
  } catch (error) {
    console.error('Error loading settings:', error);
    return settingsCache; // Return cached version if available
  }
}

export async function getSetting(key: string, defaultValue?: any): Promise<any> {
  const settings = await getSettings();
  return settings[key] ?? defaultValue;
}

// Helper functions for common settings
export async function getPredictionKeywords(): Promise<string[]> {
  return await getSetting('keywords_prediction', []);
}

export async function getExclusionKeywords(): Promise<string[]> {
  return await getSetting('keywords_exclusion', []);
}

export async function getRedditThresholds() {
  return {
    minUpvotes: await getSetting('threshold_reddit_upvotes', 50),
    minComments: await getSetting('threshold_reddit_comments', 5),
    minUpvoteRatio: await getSetting('threshold_reddit_ratio', 0.6),
  };
}

export async function getXAccounts(): Promise<string[]> {
  return await getSetting('x_monitor_accounts', [
    'breakingnews',
    'CNNBreaking',
    'Reuters',
  ]);
}

export async function getXThresholds() {
  return {
    minLikes: await getSetting('threshold_x_likes', 500),
    minRetweets: await getSetting('threshold_x_retweets', 50),
  };
}

export function clearSettingsCache() {
  settingsCache = {};
  lastCacheUpdate = 0;
}
