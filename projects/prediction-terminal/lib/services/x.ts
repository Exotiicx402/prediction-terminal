export interface XTrend {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  author_handle: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
}

// Apify API configuration
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'apidojo/twitter-scraper-lite'; // Lightweight Twitter scraper

// Get tweets from a specific account via Apify
export async function fetchXAccountTweets(
  account: string,
  limit: number = 10
): Promise<XTrend[]> {
  if (!APIFY_API_TOKEN) {
    console.error('APIFY_API_TOKEN not configured');
    return [];
  }

  try {
    console.log(`Fetching tweets for account: ${account}`);
    
    // Start actor run first
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
      body: JSON.stringify({
        searchMode: 'user',
        searchTerms: [account],
        maxTweets: limit,
        addUserInfo: true,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run start failed:', runResponse.status, errorText);
      return [];
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;
    console.log(`Apify run started: ${runId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds
    let status = '';

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        { headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` } }
      );
      
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      
      console.log(`Apify run status: ${status}`);
      
      if (status === 'SUCCEEDED') {
        break;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error(`Apify run ${status}`);
        return [];
      }
      
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      console.error('Apify run timed out');
      return [];
    }

    // Get the dataset items
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?format=json`,
      { headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` } }
    );

    if (!datasetResponse.ok) {
      console.error('Failed to fetch dataset:', await datasetResponse.text());
      return [];
    }

    const results = await datasetResponse.json();
    console.log(`Got ${results.length} tweets from Apify`);
    
    return parseApifyResults(results, account);
  } catch (error) {
    console.error('Error fetching from Apify:', error);
    return [];
  }
}

// Parse Apify results
function parseApifyResults(results: any[], account: string): XTrend[] {
  const trends: XTrend[] = [];
  
  for (const tweet of results) {
    trends.push({
      id: tweet.id || tweet.tweetId || String(Date.now()),
      title: tweet.text?.substring(0, 100) || '',
      content: tweet.text || '',
      url: tweet.url || `https://x.com/${account}/status/${tweet.id}`,
      author: tweet.author?.userName || account,
      author_handle: tweet.author?.userName || account,
      likes: tweet.likeCount || 0,
      retweets: tweet.retweetCount || 0,
      replies: tweet.replyCount || 0,
      created_at: tweet.createdAt || new Date().toISOString(),
    });
  }

  return trends;
}

// Fetch trending topics from specific X accounts
export async function fetchXTrends(
  query?: string,
  limit: number = 20,
  customAccounts?: string[]
): Promise<XTrend[]> {
  // Use custom accounts if provided, otherwise use defaults
  const trendAccounts = customAccounts || [
    'breakingnews',
    'CNNBreaking',
    'Reuters',
    'AP',
    'BBCBreaking',
  ];

  const allTweets: XTrend[] = [];

  // Fetch from 2-3 accounts to get variety
  for (const account of trendAccounts.slice(0, 3)) {
    const tweets = await fetchXAccountTweets(account, 5);
    allTweets.push(...tweets);
  }

  // Sort by date (most recent first)
  allTweets.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return allTweets.slice(0, limit);
}

export async function searchX(
  query: string,
  limit: number = 20
): Promise<XTrend[]> {
  // Use specific accounts that might tweet about the query
  const account = 'breakingnews'; // Default to breaking news
  return fetchXAccountTweets(account, limit);
}

// Key X accounts to monitor for prediction market topics
export const PREDICTION_MARKET_X_ACCOUNTS = [
  'breakingnews',
  'CNNBreaking',
  'BBCBreaking',
  'Reuters',
  'AP',
  'business',
  'markets',
  'crypto',
  'elonmusk',
  'NASA',
];

export async function fetchTopicTrends(topic: string): Promise<XTrend[]> {
  return searchX(topic, 10);
}

export async function fetchAccountTrends(accounts: string[]): Promise<XTrend[]> {
  const allTrends: XTrend[] = [];
  
  for (const account of accounts.slice(0, 5)) {
    const trends = await fetchXAccountTweets(account, 3);
    allTrends.push(...trends);
  }
  
  return allTrends;
}

// Calculate engagement score for X
export function calculateXEngagement(trend: XTrend): number {
  // Since Nitter doesn't provide metrics, use timestamp recency as proxy
  const hoursOld = (Date.now() - new Date(trend.created_at).getTime()) / (1000 * 60 * 60);
  return Math.max(0, 100 - hoursOld); // More recent = higher score
}
