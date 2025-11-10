export interface WebTrend {
  id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  published_date?: string;
  score: number;
}

export async function fetchWebTrends(
  query: string = 'trending news',
  limit: number = 20
): Promise<WebTrend[]> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    console.error('EXA_API_KEY not configured');
    return [];
  }

  try {
    // Exa.ai search API
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: limit,
        use_autoprompt: true,
        type: 'neural',
        contents: {
          text: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa.ai API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Exa.ai response to our format
    return data.results?.map((result: any) => ({
      id: result.id || result.url,
      title: result.title,
      content: result.text || result.summary || '',
      url: result.url,
      author: result.author,
      published_date: result.published_date,
      score: result.score || 0,
    })) || [];
  } catch (error) {
    console.error('Error fetching web trends:', error);
    return [];
  }
}

export async function searchWebContent(
  query: string,
  options?: {
    category?: string;
    start_published_date?: string;
    end_published_date?: string;
  }
): Promise<WebTrend[]> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    console.error('EXA_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: 20,
        use_autoprompt: true,
        type: 'neural',
        category: options?.category,
        start_published_date: options?.start_published_date,
        end_published_date: options?.end_published_date,
        contents: {
          text: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa.ai API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.results?.map((result: any) => ({
      id: result.id || result.url,
      title: result.title,
      content: result.text || result.summary || '',
      url: result.url,
      author: result.author,
      published_date: result.published_date,
      score: result.score || 0,
    })) || [];
  } catch (error) {
    console.error('Error searching web content:', error);
    return [];
  }
}

// Prediction market relevant queries
export const WEB_SEARCH_QUERIES = [
  'breaking news events',
  'upcoming political elections',
  'major tech product launches',
  'sports championships predictions',
  'cryptocurrency developments',
  'economic indicators forecast',
  'climate policy changes',
  'entertainment awards predictions',
];

export async function fetchNewsFromCategory(
  category: 'news' | 'company' | 'research paper' | 'tweet' | 'github'
): Promise<WebTrend[]> {
  return searchWebContent('trending topics', { category });
}

// Get breaking news from the last 24 hours
export async function fetchRecentBreakingNews(): Promise<WebTrend[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return searchWebContent('breaking news', {
    category: 'news',
    start_published_date: yesterday.toISOString(),
  });
}

// Find similar content to a given URL (for discovering related trends)
export async function findSimilarContent(url: string): Promise<WebTrend[]> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    console.error('EXA_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.exa.ai/findSimilar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        num_results: 10,
        contents: {
          text: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa.ai API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.results?.map((result: any) => ({
      id: result.id || result.url,
      title: result.title,
      content: result.text || result.summary || '',
      url: result.url,
      author: result.author,
      published_date: result.published_date,
      score: result.score || 0,
    })) || [];
  } catch (error) {
    console.error('Error finding similar content:', error);
    return [];
  }
}
