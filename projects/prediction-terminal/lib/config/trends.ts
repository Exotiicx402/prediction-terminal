// Keywords that indicate prediction market potential
export const PREDICTION_KEYWORDS = [
  // Events & Outcomes
  'election', 'vote', 'poll', 'forecast', 'prediction', 'odds', 'betting',
  'will happen', 'will win', 'will lose', 'outcome', 'result',
  
  // Politics
  'trump', 'biden', 'desantis', 'harris', 'senate', 'congress', 'governor',
  'primary', 'debate', 'campaign', 'policy', 'executive order',
  
  // Economics & Finance
  'inflation', 'recession', 'fed rate', 'stock market', 'crash', 'rally',
  'earnings', 'ipo', 'merger', 'acquisition', 'bankruptcy', 'default',
  'bitcoin', 'crypto', 'ethereum', 'sec approval',
  
  // Sports
  'championship', 'playoffs', 'super bowl', 'world series', 'finals',
  'mvp', 'trade', 'draft pick', 'injury report', 'game 7',
  
  // Tech & Business
  'product launch', 'apple event', 'tesla', 'spacex', 'ai release',
  'layoffs', 'ceo', 'scandal', 'investigation', 'lawsuit',
  
  // Entertainment & Culture
  'oscars', 'emmys', 'grammys', 'box office', 'streaming numbers',
  'album release', 'tour announcement', 'controversy',
  
  // Science & Climate
  'breakthrough', 'clinical trial', 'fda approval', 'climate summit',
  'emissions target', 'vaccine', 'pandemic', 'outbreak',
  
  // Geopolitics
  'war', 'peace talks', 'sanctions', 'treaty', 'alliance', 'conflict',
  'summit', 'diplomatic', 'military action', 'ceasefire',
];

// Exclusion keywords (things we DON'T want)
export const EXCLUSION_KEYWORDS = [
  'nsfw', 'porn', 'xxx', 'onlyfans',
  'buy my', 'check out my', 'subscribe to',
  'upvote if', 'karma', 'cake day',
];

// Minimum engagement thresholds
export const ENGAGEMENT_THRESHOLDS = {
  reddit: {
    minUpvotes: 50,        // At least 50 upvotes (lowered for testing)
    minComments: 5,        // At least 5 comments (lowered for testing)
    minUpvoteRatio: 0.6,   // At least 60% upvote ratio (lowered for testing)
  },
  x: {
    minLikes: 500,         // At least 500 likes
    minRetweets: 50,       // At least 50 retweets
  },
  web: {
    minScore: 0.5,         // Exa.ai relevance score
  },
};

// Helper function to check if content matches keywords
export function hasRelevantKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for exclusions first
  if (EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return false;
  }
  
  // Check for at least one prediction keyword
  return PREDICTION_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Helper function to check engagement thresholds
export function meetsEngagementThreshold(
  source: 'reddit' | 'x' | 'web',
  engagement: {
    upvotes?: number;
    comments?: number;
    upvoteRatio?: number;
    likes?: number;
    retweets?: number;
    score?: number;
  }
): boolean {
  switch (source) {
    case 'reddit':
      return (
        (engagement.upvotes || 0) >= ENGAGEMENT_THRESHOLDS.reddit.minUpvotes &&
        (engagement.comments || 0) >= ENGAGEMENT_THRESHOLDS.reddit.minComments &&
        (engagement.upvoteRatio || 0) >= ENGAGEMENT_THRESHOLDS.reddit.minUpvoteRatio
      );
    
    case 'x':
      return (
        (engagement.likes || 0) >= ENGAGEMENT_THRESHOLDS.x.minLikes &&
        (engagement.retweets || 0) >= ENGAGEMENT_THRESHOLDS.x.minRetweets
      );
    
    case 'web':
      return (engagement.score || 0) >= ENGAGEMENT_THRESHOLDS.web.minScore;
    
    default:
      return false;
  }
}

// Get keyword match count for prioritization
export function countKeywordMatches(text: string): number {
  const lowerText = text.toLowerCase();
  return PREDICTION_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;
}

// Extract matched keywords from text
export function extractMatchedKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return PREDICTION_KEYWORDS.filter(keyword => lowerText.includes(keyword));
}
