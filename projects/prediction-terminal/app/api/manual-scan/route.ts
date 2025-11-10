import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { fetchSubredditTrends, PREDICTION_MARKET_SUBREDDITS } from '@/lib/services/reddit';
import { analyzeTrendForMarkets } from '@/lib/services/openai';
import { hasRelevantKeywords, meetsEngagementThreshold } from '@/lib/config/trends';
import { findMatchingMarkets, calculateMatchScore } from '@/lib/services/polymarket';

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const results = [];

    console.log('Starting manual scan...');

    // Scan first 3 subreddits
    for (const subreddit of PREDICTION_MARKET_SUBREDDITS.slice(0, 3)) {
      console.log(`Scanning r/${subreddit}...`);
      
      const trends = await fetchSubredditTrends(subreddit, 10);
      console.log(`Found ${trends.length} posts in r/${subreddit}`);

      for (const trend of trends) {
        const combinedText = `${trend.title} ${trend.content}`;
        
        // Check keywords
        const hasKeywords = hasRelevantKeywords(combinedText);
        
        // Check engagement
        const meetsEngagement = meetsEngagementThreshold('reddit', {
          upvotes: trend.upvotes,
          comments: trend.comments,
          upvoteRatio: trend.velocity_score,
        });

        console.log(`Post: ${trend.title.substring(0, 50)}...`);
        console.log(`  - Has keywords: ${hasKeywords}`);
        console.log(`  - Meets engagement: ${meetsEngagement} (${trend.upvotes} upvotes, ${trend.comments} comments)`);

        if (!hasKeywords || !meetsEngagement) {
          continue;
        }

        // Check if exists
        const { data: existing } = await supabase
          .from('trends')
          .select('id')
          .eq('source', 'reddit')
          .eq('source_id', trend.id)
          .single();

        if (existing) {
          console.log(`  - Already exists, skipping`);
          continue;
        }

        // Insert trend
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
          console.error('Error inserting:', insertError);
          continue;
        }

        console.log(`  - Inserted to database, analyzing with AI...`);

        // Analyze with AI
        const analysis = await analyzeTrendForMarkets({
          title: trend.title,
          content: trend.content,
          source: 'reddit',
          url: trend.url,
          engagement_score: trend.upvotes,
        });

        console.log(`  - AI Analysis: ${analysis.market_potential} potential (${Math.round(analysis.confidence_score * 100)}% confidence)`);

        // Insert analysis
        await supabase.from('analyses').insert({
          trend_id: insertedTrend.id,
          market_potential: analysis.market_potential,
          confidence_score: analysis.confidence_score,
          summary: analysis.summary,
          reasoning: analysis.reasoning,
          suggested_markets: analysis.suggested_markets,
          keywords: analysis.keywords,
        });

        await supabase
          .from('trends')
          .update({ status: 'analyzed' })
          .eq('id', insertedTrend.id);

        // Find matching Polymarket markets
        console.log(`  - Searching for matching Polymarket markets...`);
        const matchingMarkets = await findMatchingMarkets(
          trend.title,
          trend.content,
          analysis.keywords || []
        );

        console.log(`  - Found ${matchingMarkets.length} matching markets`);

        // Store market matches
        for (const market of matchingMarkets) {
          const matchScore = calculateMatchScore(
            { title: trend.title, content: trend.content, keywords: analysis.keywords },
            market
          );

          if (matchScore > 5) { // Only store good matches
            await supabase.from('market_matches').insert({
              trend_id: insertedTrend.id,
              market_id: market.id,
              market_slug: market.market_slug,
              market_question: market.question,
              market_volume: market.volume,
              market_liquidity: market.liquidity,
              market_category: market.category,
              market_url: `https://polymarket.com/event/${market.market_slug}`,
              match_score: matchScore,
              match_keywords: analysis.keywords,
              ad_potential: matchScore > 20 ? 'high' : matchScore > 10 ? 'medium' : 'low',
            });
          }
        }

        results.push({
          title: trend.title,
          potential: analysis.market_potential,
          confidence: analysis.confidence_score,
          markets_found: matchingMarkets.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scanned and analyzed ${results.length} trends`,
      results,
    });
  } catch (error) {
    console.error('Manual scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
