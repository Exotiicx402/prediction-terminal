import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch markets sorted by creation date (newest first) and only active ones
    const response = await fetch('https://gamma-api.polymarket.com/markets?limit=100&closed=false&order=createdAt&ascending=false', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to only truly active markets and sort by volume
    const activeMarkets = data
      .filter((m: any) => m.active && !m.closed)
      .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 50);

    return NextResponse.json(activeMarkets);
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
