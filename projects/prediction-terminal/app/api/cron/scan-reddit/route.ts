import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchRisingTrends, fetchNewTrends, fetchSubredditTrends, PREDICTION_MARKET_SUBREDDITS } from '@/lib/services/reddit';
import { analyzeTrendForMarkets } from '@/lib/services/openai';
import { sendTrendAlert, sendSystemNotification } from '@/lib/services/slack';
import { hasRelevantKeywords, meetsEngagementThreshold, extractMatchedKeywords } from '@/lib/config/trends';

export const maxDuration = 60; // 60 seconds timeout

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();
    const trendsProcessed: string[] = [];
    const highPotentialTrends: string[] = [];

    // Fetch rising trends from r/all for real-time insights (50 posts)
    const risingTrends = await fetchRisingTrends(50);
    
    // Also fetch newest trends (30 posts) to catch things early
    const newTrends = await fetchNewTrends(30);
    
    // Combine and deduplicate
    const allTrends = [...risingTrends, ...newTrends];
    const uniqueTrends = Array.from(
      new Map(allTrends.map(t => [t.id, t])).values()
    );

    console.log(`Scanning ${uniqueTrends.length} unique Reddit trends (rising + new)`);

    for (const trend of uniqueTrends) {
        // Filter by keywords first
        const combinedText = `${trend.title} ${trend.content}`;
        if (!hasRelevantKeywords(combinedText)) {
          continue; // Skip if no relevant keywords
        }

        // Lower thresholds for rising/new content to catch trends early
        // Skip only if very low engagement (< 10 upvotes or 0 comments)
        if (trend.upvotes < 10 || trend.comments < 1) {
          continue;
        }

        // Check if we've already processed this trend
        const { data: existing } = await supabase
          .from('trends')
          .select('id')
          .eq('source', 'reddit')
          .eq('source_id', trend.id)
          .single();

        if (existing) {
          continue; // Skip if already exists
        }

        // Insert trend into database
        const { data: insertedTrend, error: insertError } = await supabase
          .from('trends')
          .insert({
            source: 'reddit',
            source_id: trend.id,
            title: trend.title,
            content: trend.content,
            url: trend.url,
            author: trend.author,
            engagement_score: trend.upvotes,
            velocity_score: trend.velocity_score,
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
        const { data: insertedAnalysis } = await supabase
          .from('analyses')
          .insert({
            trend_id: insertedTrend.id,
            market_potential: 'none',
            confidence_score: 0,
            summary: trend.title,
            reasoning: 'AI analysis disabled',
            suggested_markets: [],
            keywords: extractMatchedKeywords(combinedText),
          })
          .select()
          .single();

        // Update trend status to analyzed
        await supabase
          .from('trends')
          .update({ status: 'analyzed' })
          .eq('id', insertedTrend.id);

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update source metadata
    await supabase
      .from('source_metadata')
      .update({
        last_scan_at: new Date().toISOString(),
        last_scan_status: 'success',
        trends_found: trendsProcessed.length,
      })
      .eq('source', 'reddit');

    // Send summary notification
    if (highPotentialTrends.length > 0) {
      await sendSystemNotification(
        `Reddit scan complete: ${trendsProcessed.length} trends processed, ${highPotentialTrends.length} high-potential opportunities found`
      );
    }

    return NextResponse.json({
      success: true,
      trendsProcessed: trendsProcessed.length,
      highPotentialTrends: highPotentialTrends.length,
    });
  } catch (error) {
    console.error('Error in Reddit scan:', error);

    await sendSystemNotification(`❌ Reddit scan failed: ${error}`);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
