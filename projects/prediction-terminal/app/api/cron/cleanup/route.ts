import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { sendSystemNotification } from '@/lib/services/slack';

export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServerSupabase();

    // Delete trends older than 30 days with low/none potential
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trendsToDelete } = await supabase
      .from('trends')
      .select('id')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['analyzed', 'dismissed']);

    if (trendsToDelete && trendsToDelete.length > 0) {
      const trendIds = trendsToDelete.map(t => t.id);

      // Delete associated analyses (alerts will cascade)
      await supabase
        .from('analyses')
        .delete()
        .in('trend_id', trendIds)
        .in('market_potential', ['low', 'none']);

      // Delete the trends
      const { error } = await supabase
        .from('trends')
        .delete()
        .in('id', trendIds);

      if (error) {
        console.error('Error deleting old trends:', error);
      }

      await sendSystemNotification(
        `🧹 Cleanup complete: ${trendsToDelete.length} old trends removed`
      );
    }

    // Reset daily API call counters
    await supabase
      .from('source_metadata')
      .update({ api_calls_today: 0 })
      .gte('api_calls_today', 0);

    return NextResponse.json({
      success: true,
      trendsDeleted: trendsToDelete?.length || 0,
    });
  } catch (error) {
    console.error('Error in cleanup job:', error);
    await sendSystemNotification(`❌ Cleanup failed: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
