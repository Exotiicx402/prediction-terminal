import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform'); // e.g. 'reddit', 'twitter'
    const category = searchParams.get('category'); // e.g. 'politics', 'sports', 'geopolitics'
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = getServerSupabase();
    
    let query = supabase
      .from('trends')
      .select('*');

    // Filter by platform (source field)
    if (platform) {
      query = query.eq('source', platform);
    }

    // Filter by category - map to subreddit patterns in author field
    if (category) {
      if (category === 'politics') {
        query = query.or('author.ilike.%politics%,author.ilike.%worldnews%');
      } else if (category === 'sports') {
        query = query.or('author.ilike.%nfl%,author.ilike.%nba%,author.ilike.%soccer%');
      } else if (category === 'geopolitics') {
        query = query.ilike('author', '%geopolitics%');
      }
    }

    // Order and limit
    query = query
      .order('detected_at', { ascending: false })
      .limit(limit);

    const { data: trends, error } = await query;

    if (error) throw error;

    return NextResponse.json({ trends: trends || [] });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
