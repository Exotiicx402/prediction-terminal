import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    const { data: trends, error } = await supabase
      .from('trends')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ trends: trends || [] });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
