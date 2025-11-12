import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // Fetch markets from database, sorted by volume
    const { data: markets, error } = await supabase
      .from('polymarket_markets')
      .select('*')
      .order('volume', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(markets || []);
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
