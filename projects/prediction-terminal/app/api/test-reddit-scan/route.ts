import { NextResponse } from 'next/server';
import { fetchRisingTrends, fetchNewTrends } from '@/lib/services/reddit';
import { hasRelevantKeywords, extractMatchedKeywords } from '@/lib/config/trends';

export async function GET() {
  try {
    // Fetch rising trends
    const risingTrends = await fetchRisingTrends(50);
    
    // Fetch new trends
    const newTrends = await fetchNewTrends(30);
    
    // Combine and deduplicate
    const allTrends = [...risingTrends, ...newTrends];
    const uniqueTrends = Array.from(
      new Map(allTrends.map(t => [t.id, t])).values()
    );

    console.log(`Total unique trends: ${uniqueTrends.length}`);

    // Analyze trends
    const analyzed = uniqueTrends.map(trend => {
      const combinedText = `${trend.title} ${trend.content}`;
      const hasKeywords = hasRelevantKeywords(combinedText);
      const matchedKeywords = extractMatchedKeywords(combinedText);
      const meetsEngagement = trend.upvotes >= 10 && trend.comments >= 1;

      return {
        id: trend.id,
        title: trend.title,
        subreddit: trend.subreddit,
        upvotes: trend.upvotes,
        comments: trend.comments,
        hasKeywords,
        matchedKeywords,
        meetsEngagement,
        passes: hasKeywords && meetsEngagement,
      };
    });

    const passing = analyzed.filter(t => t.passes);
    const failedKeywords = analyzed.filter(t => !t.hasKeywords && t.meetsEngagement);
    const failedEngagement = analyzed.filter(t => t.hasKeywords && !t.meetsEngagement);

    return NextResponse.json({
      totalFetched: uniqueTrends.length,
      passing: passing.length,
      failedKeywords: failedKeywords.length,
      failedEngagement: failedEngagement.length,
      samples: {
        passing: passing.slice(0, 5),
        failedKeywords: failedKeywords.slice(0, 5),
        failedEngagement: failedEngagement.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
