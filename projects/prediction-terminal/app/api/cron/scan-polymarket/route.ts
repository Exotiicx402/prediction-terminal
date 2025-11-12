import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch markets from Polymarket API
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=100&closed=false&order=createdAt&ascending=false',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }

    const data = await response.json();

    // Filter to only truly active markets and sort by volume
    const activeMarkets = data
      .filter((m: any) => m.active && !m.closed)
      .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 50);

    console.log(`Fetched ${activeMarkets.length} active Polymarket markets`);

    return NextResponse.json({
      success: true,
      marketsFetched: activeMarkets.length,
    });
  } catch (error) {
    console.error('Error in Polymarket scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
