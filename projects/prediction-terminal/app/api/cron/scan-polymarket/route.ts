import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();
    
    // Fetch active markets from Polymarket Gamma API (only returns markets with live pages)
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=100&active=true&closed=false',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket Gamma API returned ${response.status}`);
    }

    const data = await response.json();

    // Group by parent market to avoid duplicates from sub-markets
    const marketsBySlug = new Map();
    
    for (const market of data) {
      if (!market.active || market.closed || !market.slug) continue;
      
      // If we haven't seen this slug yet, or this market has higher volume, use it
      const existing = marketsBySlug.get(market.slug);
      if (!existing || parseFloat(market.volume || 0) > parseFloat(existing.volume || 0)) {
        marketsBySlug.set(market.slug, market);
      }
    }

    // Convert to array and sort by volume
    const activeMarkets = Array.from(marketsBySlug.values())
      .sort((a: any, b: any) => {
        const volumeA = parseFloat(a.volume || 0);
        const volumeB = parseFloat(b.volume || 0);
        return volumeB - volumeA;
      })
      .slice(0, 100);

    console.log(`Fetched ${activeMarkets.length} unique parent markets`);

    // Upsert markets into database
    let marketsInserted = 0;
    for (const market of activeMarkets) {
      const { error } = await supabase
        .from('polymarket_markets')
        .upsert(
          {
            id: market.id,
            question: market.question,
            description: market.description || '',
            volume: parseFloat(market.volume || 0),
            liquidity: parseFloat(market.liquidity || 0),
            current_odds: market.outcomePrices ? parseFloat(market.outcomePrices[0]) : null,
            end_date: market.endDate ? new Date(market.endDate).toISOString() : null,
            category: market.category || null,
            slug: market.slug,
            market_url: `https://polymarket.com/event/${market.slug}`,
            raw_data: market,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (!error) {
        marketsInserted++;
      } else {
        console.error('Error upserting market:', error);
      }
    }

    console.log(`Synced ${marketsInserted}/${activeMarkets.length} markets to database`);

    return NextResponse.json({
      success: true,
      marketsSynced: marketsInserted,
      marketsEvaluated: activeMarkets.length,
    });
  } catch (error) {
    console.error('Error in Polymarket scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
