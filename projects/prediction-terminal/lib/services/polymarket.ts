export interface PolymarketMarket {
  id: string;
  condition_id: string;
  question: string;
  description?: string;
  market_slug: string;
  end_date_iso: string;
  outcomes: string[];
  outcome_prices: number[];
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  category: string;
  tags?: string[];
  icon?: string;
  image?: string;
}

const GAMMA_API = 'https://gamma-api.polymarket.com';

export async function fetchActiveMarkets(limit: number = 100): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
}

export async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  try {
    const response = await fetch(`${GAMMA_API}/markets/${slug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching market ${slug}:`, error);
    return null;
  }
}

export async function searchMarkets(query: string): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(`${GAMMA_API}/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching markets:', error);
    return [];
  }
}

// Match a trend to relevant Polymarket markets
export async function findMatchingMarkets(
  trendTitle: string,
  trendContent: string,
  keywords: string[]
): Promise<PolymarketMarket[]> {
  const allMatches: PolymarketMarket[] = [];
  
  // Search by keywords
  for (const keyword of keywords.slice(0, 5)) {
    const results = await searchMarkets(keyword);
    allMatches.push(...results);
  }
  
  // Search by trend title
  const titleResults = await searchMarkets(trendTitle);
  allMatches.push(...titleResults);
  
  // Deduplicate by market ID
  const uniqueMarkets = Array.from(
    new Map(allMatches.map(m => [m.id, m])).values()
  );
  
  // Filter to active markets with decent volume
  return uniqueMarkets.filter(m => 
    m.active && 
    !m.closed && 
    m.volume > 100 // At least $100 in volume
  );
}

// Calculate match score between trend and market
export function calculateMatchScore(
  trend: { title: string; content: string; keywords?: string[] },
  market: PolymarketMarket
): number {
  let score = 0;
  
  const trendText = `${trend.title} ${trend.content}`.toLowerCase();
  const marketText = `${market.question} ${market.description || ''} ${market.tags?.join(' ') || ''}`.toLowerCase();
  
  // Keyword matches (high weight)
  if (trend.keywords) {
    for (const keyword of trend.keywords) {
      if (marketText.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
  }
  
  // Direct text overlap
  const trendWords = trendText.split(/\s+/);
  const marketWords = new Set(marketText.split(/\s+/));
  
  for (const word of trendWords) {
    if (word.length > 4 && marketWords.has(word)) {
      score += 1;
    }
  }
  
  // Volume boost (markets with more volume are better ad targets)
  if (market.volume > 10000) score += 5;
  else if (market.volume > 1000) score += 3;
  
  // Liquidity boost
  if (market.liquidity > 10000) score += 3;
  else if (market.liquidity > 1000) score += 2;
  
  return score;
}
