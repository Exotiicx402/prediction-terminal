import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchRecentBreakingNews, WEB_SEARCH_QUERIES, searchWebContent } from '@/lib/services/web';
import { analyzeTrendForMarkets } from '@/lib/services/openai';
import { sendTrendAlert, sendSystemNotification } from '@/lib/services/slack';

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

    // Fetch breaking news
    const breakingNews = await fetchRecentBreakingNews();
    console.log('Breaking news fetched:', breakingNews.length);
    
    // Also search for specific topics
    const topicSearches = await Promise.all(
      WEB_SEARCH_QUERIES.slice(0, 3).map(query => searchWebContent(query, { category: 'news' }))
    );
    console.log('Topic searches fetched:', topicSearches.flat().length);
    
    const allTrends = [...breakingNews, ...topicSearches.flat()];
    console.log('Total web trends:', allTrends.length);

    for (const trend of allTrends.slice(0, 10)) {
      const { data: existing } = await supabase
        .from('trends')
        .select('id')
        .eq('source', 'web')
        .eq('source_id', trend.id)
        .single();

      if (existing) {
        continue;
      }

      const { data: insertedTrend, error: insertError } = await supabase
        .from('trends')
        .insert({
          source: 'web',
          source_id: trend.id,
          title: trend.title,
          content: trend.content,
          url: trend.url,
          author: trend.author,
          engagement_score: Math.round(trend.score * 100),
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
      .eq('source', 'web');

    if (highPotentialTrends.length > 0) {
      await sendSystemNotification(
        `Web scan complete: ${trendsProcessed.length} trends processed, ${highPotentialTrends.length} high-potential opportunities found`
      );
    }

    return NextResponse.json({
      success: true,
      trendsProcessed: trendsProcessed.length,
      highPotentialTrends: highPotentialTrends.length,
    });
  } catch (error) {
    console.error('Error in web scan:', error);
    await sendSystemNotification(`❌ Web scan failed: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
