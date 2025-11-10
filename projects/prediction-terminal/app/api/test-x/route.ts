import { NextResponse } from 'next/server';
import { fetchXTrends, fetchXAccountTweets } from '@/lib/services/x';

export async function GET() {
  try {
    console.log('Testing X/Nitter integration...');
    
    // Test fetching from a specific account
    const breakingNews = await fetchXAccountTweets('breakingnews', 5);
    console.log(`Fetched ${breakingNews.length} tweets from @breakingnews`);
    
    // Test general trending function
    const trends = await fetchXTrends(undefined, 10);
    console.log(`Fetched ${trends.length} total trending tweets`);
    
    return NextResponse.json({
      success: true,
      accountTest: {
        count: breakingNews.length,
        tweets: breakingNews.map(t => ({
          author: t.author,
          title: t.title.substring(0, 100),
          created_at: t.created_at,
        })),
      },
      trendsTest: {
        count: trends.length,
        tweets: trends.map(t => ({
          author: t.author,
          title: t.title.substring(0, 100),
          created_at: t.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('X test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
