import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchSubredditTrends } from '@/lib/services/reddit';
import { sendSystemNotification } from '@/lib/services/slack';

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
    
    // Target specific high-value subreddits
    const targetSubreddits = [
      'politics',
      'geopolitics', 
      'worldnews',
      'nfl',
      'nba',
      'soccer'
    ];

    const allTrends = [];
    
    // Fetch hot posts from each subreddit
    for (const subreddit of targetSubreddits) {
      try {
        const trends = await fetchSubredditTrends(subreddit, 25);
        allTrends.push(...trends);
      } catch (error) {
        console.error(`Error fetching from r/${subreddit}:`, error);
      }
    }

    console.log(`Fetched ${allTrends.length} posts from ${targetSubreddits.length} subreddits`);
    
    // Filter to posts from last 24 hours with 500+ upvotes
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uniqueTrends = Array.from(
      new Map(
        allTrends
          .filter(t => {
            const postDate = new Date(t.created_at);
            return t.upvotes >= 500 && postDate >= oneDayAgo;
          })
          .map(t => [t.id, t])
      ).values()
    );

    console.log(`${uniqueTrends.length} posts meet criteria (500+ upvotes, last 24h)`);

    for (const trend of uniqueTrends) {
      // Already filtered for 500+ upvotes and last 24 hours

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
            status: 'pending',
          })
        .select()
        .single();

      if (insertError || !insertedTrend) {
        console.error('Error inserting trend:', insertError);
        continue;
      }

      trendsProcessed.push(insertedTrend.id);

      // No automatic analysis - just mark as pending
      await supabase
        .from('trends')
        .update({ status: 'pending' })
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

    console.log(`Reddit scan complete: ${trendsProcessed.length} posts added from ${targetSubreddits.length} subreddits`);

    return NextResponse.json({
      success: true,
      postsAdded: trendsProcessed.length,
      subredditsScanned: targetSubreddits.length,
      postsEvaluated: uniqueTrends.length,
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
