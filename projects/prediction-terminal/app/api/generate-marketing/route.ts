import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { type, item } = await request.json();

    let prompt = '';
    
    if (type === 'trend') {
      prompt = `You are a marketing strategist for Polymarket, the world's largest prediction market platform.

A trending topic has emerged:
Title: ${item.title}
Source: ${item.source}
Content: ${item.content || 'N/A'}
Engagement: ${item.engagement_score} upvotes/likes

Generate creative marketing ideas for Polymarket based on this trend:

1. **Market Opportunity**: What prediction market could be created around this trend?
2. **Marketing Angle**: How should Polymarket position itself in conversations about this topic?
3. **Content Ideas**: 3-5 specific content pieces (tweets, blog posts, videos) we could create
4. **Target Audience**: Who would be most interested in betting on this?
5. **Messaging**: Key talking points and value props to emphasize

Be specific, actionable, and focused on driving user engagement and market creation.`;
    } else if (type === 'market') {
      prompt = `You are a marketing strategist for Polymarket, the world's largest prediction market platform.

An active market exists on the platform:
Question: ${item.question}
Volume: $${(item.volume || 0).toLocaleString()}
Liquidity: $${(item.liquidity || 0).toLocaleString()}

Generate marketing ideas to promote this specific market:

1. **Marketing Hook**: What makes this market interesting or newsworthy?
2. **Audience Targeting**: Who should we reach with ads/content about this market?
3. **Content Strategy**: 3-5 content pieces to drive traffic and engagement
4. **Cross-Promotion**: How can we tie this to current events or other trending topics?
5. **Call to Action**: Compelling reasons for users to trade on this market now

Be specific, actionable, and focused on driving trading volume.`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a creative marketing strategist specializing in prediction markets and viral content. Be specific, actionable, and insightful.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const analysis = completion.choices[0]?.message?.content || 'No analysis generated.';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error generating marketing:', error);
    return NextResponse.json(
      { error: 'Failed to generate marketing ideas' },
      { status: 500 }
    );
  }
}
