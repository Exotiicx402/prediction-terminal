import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { source } = await request.json();
    
    // Get the base URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const cronSecret = process.env.CRON_SECRET;
    
    let endpoint = '';
    switch (source) {
      case 'reddit':
        endpoint = '/api/cron/scan-reddit';
        break;
      case 'x':
        endpoint = '/api/cron/scan-x';
        break;
      case 'web':
        endpoint = '/api/cron/scan-web';
        break;
      case 'all':
        // Trigger Reddit and X scans
        const results = await Promise.all([
          fetch(`${baseUrl}/api/cron/scan-reddit`, {
            headers: { 'Authorization': `Bearer ${cronSecret}` }
          }),
          fetch(`${baseUrl}/api/cron/scan-x`, {
            headers: { 'Authorization': `Bearer ${cronSecret}` }
          })
        ]);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Reddit and X scans triggered',
          results: await Promise.all(results.map(r => r.json()))
        });
      default:
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // Trigger the specific scan
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      message: `${source} scan triggered`,
      data 
    });
  } catch (error) {
    console.error('Error triggering scan:', error);
    return NextResponse.json({ error: 'Failed to trigger scan' }, { status: 500 });
  }
}
