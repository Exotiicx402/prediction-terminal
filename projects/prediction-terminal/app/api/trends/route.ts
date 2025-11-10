import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const potential = searchParams.get('potential');
    const source = searchParams.get('source');

    let query = supabase
      .from('high_potential_trends')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (potential && potential !== 'all') {
      query = query.eq('market_potential', potential);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ trends: data });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
