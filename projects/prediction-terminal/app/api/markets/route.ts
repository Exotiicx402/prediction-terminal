import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // e.g. 'politics', 'sports', 'crypto', 'entertainment'
    const sort = searchParams.get('sort') || 'volume'; // 'volume', 'updated_at', 'end_date'
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = getServerSupabase();
    
    let query = supabase
      .from('polymarket_markets')
      .select('*');

    // Filter by category
    if (category) {
      if (category === 'politics') {
        query = query.or('category.ilike.%politic%,category.ilike.%election%');
      } else if (category === 'sports') {
        query = query.or('category.ilike.%sport%,category.ilike.%nba%,category.ilike.%nfl%,category.ilike.%soccer%');
      } else if (category === 'crypto') {
        query = query.or('category.ilike.%crypto%,category.ilike.%bitcoin%,category.ilike.%ethereum%');
      } else if (category === 'entertainment') {
        query = query.or('category.ilike.%entertain%,category.ilike.%culture%,category.ilike.%pop%');
      } else {
        // Generic category filter
        query = query.ilike('category', `%${category}%`);
      }
    }

    // Apply sorting
    if (sort === 'volume') {
      query = query.order('volume', { ascending: false });
    } else if (sort === 'updated_at') {
      query = query.order('updated_at', { ascending: false });
    } else if (sort === 'end_date') {
      query = query.order('end_date', { ascending: true }); // Soonest first
    } else {
      // Default to volume
      query = query.order('volume', { ascending: false });
    }

    query = query.limit(limit);

    const { data: markets, error } = await query;

    if (error) throw error;

    return NextResponse.json(markets || []);
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
