import { NextResponse } from 'next/server';
import { fetchXTrends } from '@/lib/services/x';
import { fetchRecentBreakingNews } from '@/lib/services/web';
import { getXAccounts } from '@/lib/services/settings';

export async function GET() {
  const results: any = {
    x: { status: 'unknown', error: null, count: 0 },
    web: { status: 'unknown', error: null, count: 0 },
  };

  // Test X
  try {
    const xAccounts = await getXAccounts();
    const xTrends = await fetchXTrends(undefined, 5, xAccounts);
    results.x = {
      status: 'success',
      error: null,
      count: xTrends.length,
      accounts: xAccounts,
    };
  } catch (error: any) {
    results.x = {
      status: 'error',
      error: error.message,
      count: 0,
    };
  }

  // Test Web
  try {
    const webTrends = await fetchRecentBreakingNews();
    results.web = {
      status: 'success',
      error: null,
      count: webTrends.length,
    };
  } catch (error: any) {
    results.web = {
      status: 'error',
      error: error.message,
      count: 0,
    };
  }

  return NextResponse.json(results);
}
