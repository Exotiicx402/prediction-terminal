import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchRedditTrends, fetchSubredditTrends, PREDICTION_MARKET_SUBREDDITS } from '@/lib/services/reddit';
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

    // Fetch trends from multiple subreddits
    for (const subreddit of PREDICTION_MARKET_SUBREDDITS.slice(0, 5)) {
      const trends = await fetchSubredditTrends(subreddit, 5);

      for (const trend of trends) {
        // Filter by keywords first
        const combinedText = `${trend.title} ${trend.content}`;
        if (!hasRelevantKeywords(combinedText)) {
          continue; // Skip if no relevant keywords
        }

        // Check engagement thresholds
        if (!meetsEngagementThreshold('reddit', {
          upvotes: trend.upvotes,
          comments: trend.comments,
          upvoteRatio: trend.velocity_score,
        })) {
          continue; // Skip if below engagement threshold
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
