export interface RedditTrend {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  created_at: string;
  velocity_score?: number;
}

// Use Reddit's public JSON API (no authentication needed)
export async function fetchRedditTrends(
  query?: string,
  limit: number = 20
): Promise<RedditTrend[]> {
  try {
    const response = await fetch('https://www.reddit.com/hot.json?limit=' + limit, {
      headers: {
        'User-Agent': 'Prediction Terminal v1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data.children;

    return posts.map((item: any) => {
      const post = item.data;
      return {
        id: post.id,
        title: post.title,
        content: post.selftext || '',
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        subreddit: post.subreddit,
        upvotes: post.ups,
        comments: post.num_comments,
        created_at: new Date(post.created_utc * 1000).toISOString(),
        velocity_score: post.upvote_ratio,
      };
    });
  } catch (error) {
    console.error('Error fetching Reddit trends:', error);
    return [];
  }
}

export async function fetchTrendingSubreddits(): Promise<string[]> {
  // Return our curated list - Reddit API doesn't have a "trending" endpoint
  return PREDICTION_MARKET_SUBREDDITS;
}

// Focus on specific subreddits likely to have prediction market opportunities
export const PREDICTION_MARKET_SUBREDDITS = [
  'wallstreetbets',
  'politics',
  'worldnews',
  'technology',
  'cryptocurrency',
  'sports',
  'nba',
  'nfl',
  'stocks',
  'investing',
  'futurology',
];

export async function fetchSubredditTrends(
  subreddit: string,
  limit: number = 10
): Promise<RedditTrend[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Prediction Terminal v1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data.children;

    return posts.map((item: any) => {
      const post = item.data;
      return {
        id: post.id,
        title: post.title,
        content: post.selftext || '',
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        subreddit: post.subreddit,
        upvotes: post.ups,
        comments: post.num_comments,
        created_at: new Date(post.created_utc * 1000).toISOString(),
        velocity_score: post.upvote_ratio,
      };
    });
  } catch (error) {
    console.error(`Error fetching trends from r/${subreddit}:`, error);
    return [];
  }
}
