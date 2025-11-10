import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // Check settings table
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*');
    
    // Check trends table
    const { data: trends, error: trendsError } = await supabase
      .from('trends')
      .select('count');
    
    // Check high_potential_trends view
    const { data: highPotential, error: viewError } = await supabase
      .from('high_potential_trends')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      settings: {
        exists: !settingsError,
        count: settings?.length || 0,
        error: settingsError?.message,
        data: settings,
      },
      trends: {
        exists: !trendsError,
        count: trends?.[0]?.count || 0,
        error: trendsError?.message,
      },
      highPotential: {
        exists: !viewError,
        count: highPotential?.length || 0,
        error: viewError?.message,
        data: highPotential,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
