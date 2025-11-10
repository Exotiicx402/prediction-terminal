import OpenAI from 'openai';
import { MarketPotential, SuggestedMarket } from '@/lib/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TrendAnalysisInput {
  title: string;
  content?: string;
  source: string;
  url?: string;
  engagement_score: number;
}

export interface TrendAnalysisResult {
  market_potential: MarketPotential;
  confidence_score: number;
  summary: string;
  reasoning: string;
  suggested_markets: SuggestedMarket[];
  keywords: string[];
}

const ANALYSIS_PROMPT = `You are an expert at identifying prediction market opportunities from trending topics.

Analyze the following trend and determine its potential for creating prediction markets on Polymarket.

Consider:
1. **Verifiability**: Can the outcome be objectively verified?
2. **Timeline**: Is there a clear resolution timeframe (preferably within 3-12 months)?
3. **Public Interest**: Will people want to bet on this?
4. **Binary Outcomes**: Can this be structured as clear yes/no or multiple choice questions?
5. **Uniqueness**: Is this different from existing Polymarket markets?

Rate the market potential as:
- **high**: Excellent fit, immediate opportunity, high engagement potential
- **medium**: Good fit but needs refinement or timing consideration
- **low**: Possible but weak fit or niche appeal
- **none**: Not suitable for prediction markets

Provide your response in JSON format with these fields:
{
  "market_potential": "high|medium|low|none",
  "confidence_score": 0.0-1.0,
  "summary": "2-3 sentence summary of the opportunity",
  "reasoning": "Detailed explanation of your assessment",
  "suggested_markets": [
    {
      "question": "Clear, specific market question",
      "market_type": "binary|multiple_choice|scalar",
      "options": ["optional array for multiple choice"],
      "resolution_criteria": "How to objectively determine the outcome",
      "estimated_liquidity": "high|medium|low"
    }
  ],
  "keywords": ["relevant", "keywords", "for", "categorization"]
}`;

export async function analyzeTrendForMarkets(
  trend: TrendAnalysisInput,
  retryCount: number = 0
): Promise<TrendAnalysisResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model to reduce costs
      messages: [
        {
          role: 'system',
          content: ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: `Trend Source: ${trend.source}
Title: ${trend.title}
Content: ${trend.content || 'N/A'}
URL: ${trend.url || 'N/A'}
Engagement Score: ${trend.engagement_score}

Analyze this trend for prediction market potential.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000, // Limit token usage
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(result) as TrendAnalysisResult;

    // Validate and sanitize the response
    if (!['high', 'medium', 'low', 'none'].includes(analysis.market_potential)) {
      analysis.market_potential = 'none';
    }

    if (analysis.confidence_score < 0 || analysis.confidence_score > 1) {
      analysis.confidence_score = Math.max(0, Math.min(1, analysis.confidence_score));
    }

    return analysis;
  } catch (error: any) {
    console.error('Error analyzing trend:', error);
    
    // Handle rate limit errors with retry
    if (error?.status === 429 && retryCount < 2) {
      console.log(`Rate limited, retrying in ${(retryCount + 1) * 5} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 5000));
      return analyzeTrendForMarkets(trend, retryCount + 1);
    }
    
    // Handle quota exceeded errors
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      console.error('OpenAI quota exceeded - skipping analysis');
    }
    
    // Return a safe default response
    return {
      market_potential: 'none',
      confidence_score: 0,
      summary: 'Failed to analyze trend',
      reasoning: error instanceof Error ? error.message : 'Unknown error',
      suggested_markets: [],
      keywords: [],
    };
  }
}

export async function batchAnalyzeTrends(
  trends: TrendAnalysisInput[],
  maxBatchSize: number = 5
): Promise<TrendAnalysisResult[]> {
  // Limit batch size to avoid quota issues
  const limitedTrends = trends.slice(0, maxBatchSize);
  const results: TrendAnalysisResult[] = [];
  
  for (const trend of limitedTrends) {
    const result = await analyzeTrendForMarkets(trend);
    results.push(result);
    
    // Longer delay to respect rate limits (2 seconds between requests)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}
