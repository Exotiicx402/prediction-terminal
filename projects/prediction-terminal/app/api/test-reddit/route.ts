import { NextResponse } from 'next/server';
import { fetchSubredditTrends } from '@/lib/services/reddit';

export async function GET() {
  try {
    console.log('Testing Reddit API connection...');
    
    // Test fetching from a popular subreddit
    const trends = await fetchSubredditTrends('worldnews', 5);
    
    console.log(`Fetched ${trends.length} trends from r/worldnews`);
    
    return NextResponse.json({
      success: true,
      trendsCount: trends.length,
      trends: trends.map(t => ({
        id: t.id,
        title: t.title,
        subreddit: t.subreddit,
        upvotes: t.upvotes,
        comments: t.comments,
      })),
    });
  } catch (error) {
    console.error('Reddit test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      },
      { status: 500 }
    );
  }
}
