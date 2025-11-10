import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchXTrends, calculateXEngagement } from '@/lib/services/x';
import { analyzeTrendForMarkets } from '@/lib/services/openai';
import { sendTrendAlert, sendSystemNotification } from '@/lib/services/slack';
import { getXAccounts } from '@/lib/services/settings';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();
    const trendsProcessed: string[] = [];
    const highPotentialTrends: string[] = [];

    // Get X accounts from settings
    const xAccounts = await getXAccounts();
    console.log('X accounts to scan:', xAccounts);

    // Fetch trending tweets from configured accounts
    const trends = await fetchXTrends(undefined, 15, xAccounts);
    console.log('X trends fetched:', trends.length);

    for (const trend of trends) {
      const { data: existing } = await supabase
        .from('trends')
        .select('id')
        .eq('source', 'x')
        .eq('source_id', trend.id)
        .single();

      if (existing) {
        continue;
      }

      const engagementScore = calculateXEngagement(trend);

      const { data: insertedTrend, error: insertError } = await supabase
        .from('trends')
        .insert({
          source: 'x',
          source_id: trend.id,
          title: trend.title,
          content: trend.content,
          url: trend.url,
          author: trend.author,
          engagement_score: engagementScore,
          status: 'analyzing',
        })
        .select()
        .single();

      if (insertError || !insertedTrend) {
        console.error('Error inserting trend:', insertError);
        continue;
      }

      trendsProcessed.push(insertedTrend.id);

      // Skip AI analysis - just mark as analyzed with default values
      await supabase
        .from('analyses')
        .insert({
          trend_id: insertedTrend.id,
          market_potential: 'none',
          confidence_score: 0,
          summary: trend.title,
          reasoning: 'AI analysis disabled',
          suggested_markets: [],
          keywords: [],
        });

      // Update trend status to analyzed
      await supabase
        .from('trends')
        .update({ status: 'analyzed' })
        .eq('id', insertedTrend.id);

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    await supabase
      .from('source_metadata')
      .update({
        last_scan_at: new Date().toISOString(),
        last_scan_status: 'success',
        trends_found: trendsProcessed.length,
      })
      .eq('source', 'x');

    if (highPotentialTrends.length > 0) {
      await sendSystemNotification(
        `X scan complete: ${trendsProcessed.length} trends processed, ${highPotentialTrends.length} high-potential opportunities found`
      );
    }

    return NextResponse.json({
      success: true,
      trendsProcessed: trendsProcessed.length,
      highPotentialTrends: highPotentialTrends.length,
    });
  } catch (error) {
    console.error('Error in X scan:', error);
    await sendSystemNotification(`❌ X scan failed: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
