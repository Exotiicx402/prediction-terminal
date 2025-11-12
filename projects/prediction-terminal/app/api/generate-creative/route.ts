import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import openai from '@/lib/services/openai';

interface CreativeAngle {
  type: string;
  hook: string;
  target_audience: string;
  why_it_works: string;
}

export async function POST(request: Request) {
  try {
    const { trend_id, market_id } = await request.json();

    if (!trend_id && !market_id) {
      return NextResponse.json(
        { error: 'Please provide at least trend_id or market_id' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Fetch trend data if provided
    let trendData = null;
    if (trend_id) {
      const { data, error } = await supabase
        .from('trends')
        .select('*')
        .eq('id', trend_id)
        .single();

      if (error) {
        console.error('Error fetching trend:', error);
      } else {
        trendData = data;
      }
    }

    // Fetch market data if provided
    let marketData = null;
    if (market_id) {
      const { data, error } = await supabase
        .from('polymarket_markets')
        .select('*')
        .eq('id', market_id)
        .single();

      if (error) {
        console.error('Error fetching market:', error);
      } else {
        marketData = data;
      }
    }

    if (!trendData && !marketData) {
      return NextResponse.json(
        { error: 'Could not fetch trend or market data' },
        { status: 404 }
      );
    }

    // Build prompt
    let prompt = 'You are a marketing strategist for Polymarket.\n\n';

    if (trendData) {
      prompt += `TRENDING TOPIC:
Title: ${trendData.title}
Platform: ${trendData.source}
Engagement: ${trendData.engagement_score?.toLocaleString() || 0} ${trendData.source === 'reddit' ? 'upvotes' : 'likes'}
URL: ${trendData.url || 'N/A'}
${trendData.content ? `\nContent: ${trendData.content.slice(0, 500)}` : ''}

`;
    }

    if (marketData) {
      prompt += `LIVE MARKET:
Question: ${marketData.question}
Category: ${marketData.category || 'N/A'}
Volume: $${(marketData.volume || 0).toLocaleString()}
Current Odds: ${marketData.current_odds != null ? `${Math.round((Number(marketData.current_odds) || 0) * 100)}%` : 'N/A'}
URL: ${marketData.market_url || 'N/A'}

`;
    }

    prompt += `Generate 5-7 creative marketing angles that ${
      trendData && marketData
        ? 'connect this trending topic to this market'
        : trendData
        ? 'leverage this trending topic for Polymarket'
        : 'promote this market'
    }.

For each angle, provide:
1. Type (fear/fomo/controversy/data/tribal/entertainment/education)
2. Hook (one-line ad copy headline - punchy, attention-grabbing)
3. Target Audience (demographics + psychographics - be specific)
4. Why This Works (1-2 sentences explaining the psychology and strategy)

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "type": "fear",
    "hook": "...",
    "target_audience": "...",
    "why_it_works": "..."
  }
]`;

    // Call OpenAI
    console.log('Calling OpenAI with prompt length:', prompt.length);
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a creative marketing strategist specializing in prediction markets and viral advertising. Return only valid JSON, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      });
      console.log('OpenAI response received');
    } catch (openaiError: any) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json(
        { error: `OpenAI API error: ${openaiError.message}` },
        { status: 500 }
      );
    }

    const responseText = completion.choices[0]?.message?.content || '[]';

    // Parse JSON response
    let angles: CreativeAngle[] = [];
    try {
      // Strip markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      angles = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Response text:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse creative angles from AI response' },
        { status: 500 }
      );
    }

    // Save to analyses table (creative_generations)
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        trend_id: trend_id || null,
        market_potential: 'medium', // Default value as this is a required field
        confidence_score: 0.8,
        summary: `Generated ${angles.length} creative marketing angles`,
        reasoning: `Marketing angles connecting ${trendData ? 'trend' : ''}${
          trendData && marketData ? ' and ' : ''
        }${marketData ? 'market' : ''}`,
        suggested_markets: {
          angles,
          trend_id,
          market_id,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to database:', saveError);
      // Don't fail the request if save fails, still return the angles
    }

    return NextResponse.json({
      angles,
      analysis_id: savedAnalysis?.id || null,
    });
  } catch (error) {
    console.error('Error generating creative angles:', error);
    return NextResponse.json(
      { error: 'Failed to generate creative angles' },
      { status: 500 }
    );
  }
}
