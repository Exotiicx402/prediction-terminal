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
    
    // Fetch active markets from Polymarket CLOB API
    const response = await fetch(
      'https://clob.polymarket.com/markets?active=true',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket CLOB API returned ${response.status}`);
    }

    const data = await response.json();

    // Sort by volume and limit to top 100
    const activeMarkets = data
      .filter((m: any) => m.active && !m.closed)
      .sort((a: any, b: any) => {
        const volumeA = parseFloat(a.volume || 0);
        const volumeB = parseFloat(b.volume || 0);
        return volumeB - volumeA;
      })
      .slice(0, 100);

    console.log(`Fetched ${activeMarkets.length} active markets from CLOB API`);

    // Upsert markets into database
    let marketsInserted = 0;
    for (const market of activeMarkets) {
      const { error } = await supabase
        .from('polymarket_markets')
        .upsert(
          {
            id: market.id || market.questionID,
            question: market.question,
            description: market.description || '',
            volume: parseFloat(market.volume || 0),
            liquidity: parseFloat(market.liquidity || 0),
            current_odds: market.outcomePrices ? parseFloat(market.outcomePrices[0]) : null,
            end_date: market.endDate ? new Date(market.endDate).toISOString() : null,
            category: market.category || null,
            slug: market.slug || market.id,
            market_url: `https://polymarket.com/event/${market.slug || market.id}`,
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
