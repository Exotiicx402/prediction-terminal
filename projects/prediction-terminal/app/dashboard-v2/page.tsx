'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Tab = 'trending' | 'markets' | 'sandbox';

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trends, setTrends] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data on mount and every 5 minutes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch trending topics
      const trendsRes = await fetch('/api/trending-posts');
      const trendsData = await trendsRes.json();
      setTrends(trendsData.trends || []);

      // Fetch Polymarket markets
      const marketsRes = await fetch('/api/polymarket-markets');
      const marketsData = await marketsRes.json();
      setMarkets(marketsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <div className="border-b border-black bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762752805/logo-black_xgggh7.svg" 
                alt="Polymarket" 
                className="h-8"
              />
              <span className="text-sm font-semibold">MARKETING COMMAND CENTER</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-semibold">
                {formatTime(currentTime)}
              </div>
              <Link 
                href="/dashboard/config" 
                className="text-sm px-3 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                ⚙️ CONFIG
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-black bg-white sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-6 py-3 font-semibold border-b-4 transition-colors ${
                activeTab === 'trending'
                  ? 'border-poly-blue text-black'
                  : 'border-transparent text-black/50 hover:text-black'
              }`}
            >
              📈 TRENDING TOPICS
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`px-6 py-3 font-semibold border-b-4 transition-colors ${
                activeTab === 'markets'
                  ? 'border-poly-blue text-black'
                  : 'border-transparent text-black/50 hover:text-black'
              }`}
            >
              💹 LIVE MARKETS
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-6 py-3 font-semibold border-b-4 transition-colors ${
                activeTab === 'sandbox'
                  ? 'border-poly-blue text-black'
                  : 'border-transparent text-black/50 hover:text-black'
              }`}
            >
              🎨 MARKETING SANDBOX
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-xl">LOADING DATA...</div>
          </div>
        )}

        {!loading && activeTab === 'trending' && (
          <TrendingTopicsTab trends={trends} onRefresh={fetchData} />
        )}

        {!loading && activeTab === 'markets' && (
          <LiveMarketsTab markets={markets} onRefresh={fetchData} />
        )}

        {!loading && activeTab === 'sandbox' && (
          <MarketingSandboxTab trends={trends} markets={markets} />
        )}
      </div>
    </div>
  );
}

// Tab 1: Trending Topics
function TrendingTopicsTab({ trends, onRefresh }: { trends: any[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'engaged'>('recent');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Calculate time ago
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get last updated text
  const getLastUpdatedText = () => {
    const diffMs = new Date().getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    return `${diffMins}m ago`;
  };

  // Filter trends
  const filteredTrends = trends.filter(trend => {
    if (filter === 'all') return true;
    // Map subreddit to category
    const subreddit = trend.author || '';
    if (filter === 'politics' && ['politics', 'worldnews'].some(s => subreddit.includes(s))) return true;
    if (filter === 'sports' && ['nfl', 'nba', 'soccer'].some(s => subreddit.includes(s))) return true;
    if (filter === 'geopolitics' && subreddit.includes('geopolitics')) return true;
    return false;
  });

  // Sort trends
  const sortedTrends = [...filteredTrends].sort((a, b) => {
    if (sortBy === 'engaged') {
      return (b.engagement_score || 0) - (a.engagement_score || 0);
    }
    return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">TRENDING TOPICS ({sortedTrends.length})</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black/50">Last updated: {getLastUpdatedText()}</span>
          <button
            onClick={() => {
              onRefresh();
              setLastUpdated(new Date());
            }}
            className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold"
          >
            🔄 REFRESH
          </button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-black">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 font-semibold text-sm border-2 transition-colors ${
              filter === 'all'
                ? 'border-poly-blue bg-poly-blue text-black'
                : 'border-black text-black hover:border-poly-blue'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilter('politics')}
            className={`px-3 py-1 font-semibold text-sm border-2 transition-colors ${
              filter === 'politics'
                ? 'border-poly-blue bg-poly-blue text-black'
                : 'border-black text-black hover:border-poly-blue'
            }`}
          >
            POLITICS
          </button>
          <button
            onClick={() => setFilter('sports')}
            className={`px-3 py-1 font-semibold text-sm border-2 transition-colors ${
              filter === 'sports'
                ? 'border-poly-blue bg-poly-blue text-black'
                : 'border-black text-black hover:border-poly-blue'
            }`}
          >
            SPORTS
          </button>
          <button
            onClick={() => setFilter('geopolitics')}
            className={`px-3 py-1 font-semibold text-sm border-2 transition-colors ${
              filter === 'geopolitics'
                ? 'border-poly-blue bg-poly-blue text-black'
                : 'border-black text-black hover:border-poly-blue'
            }`}
          >
            GEOPOLITICS
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'engaged')}
          className="px-3 py-1 border-2 border-black font-semibold text-sm bg-white"
        >
          <option value="recent">RECENT</option>
          <option value="engaged">MOST ENGAGED</option>
        </select>
      </div>

      {sortedTrends.length === 0 ? (
        <div className="text-center py-20 text-black/50">
          No trending topics found. Check back soon.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedTrends.map((trend) => (
            <div
              key={trend.id}
              className="border-2 border-black p-4 hover:border-poly-blue transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {trend.source === 'reddit' && (
                      <img 
                        src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762753040/reddit-svgrepo-com_nmgvwi.svg" 
                        alt="Reddit" 
                        className="w-5 h-5" 
                      />
                    )}
                    <span className="text-xs font-semibold uppercase">{trend.source}</span>
                    <span className="text-xs text-black/50">•</span>
                    <span className="text-xs font-semibold text-black/70">
                      r/{trend.author || 'unknown'}
                    </span>
                    <span className="text-xs text-black/50">•</span>
                    <span className="text-xs text-black/50">
                      {getTimeAgo(trend.detected_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{trend.title}</h3>
                  {trend.content && (
                    <p className="text-sm text-black/70 mb-3 line-clamp-2">{trend.content}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">
                      ⬆️ {trend.engagement_score.toLocaleString()}
                    </span>
                    {trend.url && (
                      <a
                        href={trend.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-poly-blue hover:underline font-semibold"
                      >
                        VIEW POST →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tab 2: Live Markets
function LiveMarketsTab({ markets, onRefresh }: { markets: any[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'recent' | 'ending'>('volume');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await onRefresh();
        setLastUpdated(new Date());
      } catch (e) {
        // ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const getLastUpdatedText = () => {
    const diffMs = new Date().getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    return `${diffMins}m ago`;
  };

  const formatCurrencyCompact = (n: number | string | null | undefined) => {
    const v = typeof n === 'string' ? parseFloat(n) : (n || 0);
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${Math.round(v).toLocaleString()}`;
  };

  const endsInText = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const end = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Ends in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `Ends in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Ends in ${days}d`;
  };

  // Apply filters
  const filtered = markets.filter((m) => {
    if (filter === 'all') return true;
    const cat = (m.category || '').toLowerCase();
    if (filter === 'politics') return cat.includes('politic') || cat.includes('election');
    if (filter === 'sports') return cat.includes('sport') || ['nba', 'nfl', 'soccer'].some(t => cat.includes(t));
    if (filter === 'crypto') return cat.includes('crypto') || cat.includes('bitcoin') || cat.includes('ethereum');
    if (filter === 'entertainment') return cat.includes('entertain') || cat.includes('culture') || cat.includes('pop');
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'volume') {
      return (parseFloat(b.volume || 0) - parseFloat(a.volume || 0));
    }
    if (sortBy === 'recent') {
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      return bTime - aTime;
    }
    // ending soon (earliest end_date first)
    const aEnd = a.end_date ? new Date(a.end_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bEnd = b.end_date ? new Date(b.end_date).getTime() : Number.MAX_SAFE_INTEGER;
    return aEnd - bEnd;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">LIVE POLYMARKET MARKETS ({sorted.length})</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black/50">Last updated: {getLastUpdatedText()}</span>
          <button
            onClick={() => { onRefresh(); setLastUpdated(new Date()); }}
            className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold"
          >
            🔄 REFRESH
          </button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-black">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'ALL' },
            { key: 'politics', label: 'POLITICS' },
            { key: 'sports', label: 'SPORTS' },
            { key: 'crypto', label: 'CRYPTO' },
            { key: 'entertainment', label: 'ENTERTAINMENT' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1 font-semibold text-sm border-2 transition-colors ${
                filter === btn.key
                  ? 'border-poly-blue bg-poly-blue text-black'
                  : 'border-black text-black hover:border-poly-blue'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'volume' | 'recent' | 'ending')}
          className="px-3 py-1 border-2 border-black font-semibold text-sm bg-white"
        >
          <option value="volume">VOLUME (HIGH→LOW)</option>
          <option value="recent">RECENT</option>
          <option value="ending">ENDING SOON</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-black/50">No markets found. Check back soon.</div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((market) => (
            <div key={market.id} className="border-2 border-black p-4 hover:border-poly-blue transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {market.category && (
                      <span className="px-2 py-0.5 text-xs border-2 border-black bg-white">
                        {String(market.category).toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs text-black/50">{endsInText(market.end_date)}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{market.question}</h3>
                  <div className="flex items-center gap-6 text-sm">
                    <span>
                      <span className="text-black/60 mr-1">VOLUME</span>
                      <span className="font-bold">{formatCurrencyCompact(market.volume)}</span>
                    </span>
                    <span>
                      <span className="text-black/60 mr-1">ODDS</span>
                      <span className="font-bold">{market.current_odds != null ? `${Math.round((Number(market.current_odds) || 0) * 100)}%` : '—'}</span>
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={market.market_url || (market.slug ? `https://polymarket.com/event/${market.slug}` : '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-2 border-2 border-black hover:bg-black hover:text-white font-semibold"
                  >
                    VIEW MARKET →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tab 3: Marketing Sandbox
function MarketingSandboxTab({ trends, markets }: { trends: any[]; markets: any[] }) {
  const [selectedType, setSelectedType] = useState<'trend' | 'market'>('trend');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const generateMarketing = async () => {
    if (!selectedItem) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          item: selectedItem,
        }),
      });

      const data = await response.json();
      setAnalysis(data.analysis || 'No analysis generated.');
    } catch (error) {
      console.error('Error generating marketing:', error);
      setAnalysis('Error generating marketing ideas.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">SELECT CONTENT</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setSelectedType('trend'); setSelectedItem(null); setAnalysis(''); }}
            className={`px-4 py-2 font-semibold border-2 ${
              selectedType === 'trend' 
                ? 'border-poly-blue bg-poly-blue text-black' 
                : 'border-black text-black'
            }`}
          >
            TRENDING TOPICS
          </button>
          <button
            onClick={() => { setSelectedType('market'); setSelectedItem(null); setAnalysis(''); }}
            className={`px-4 py-2 font-semibold border-2 ${
              selectedType === 'market' 
                ? 'border-poly-blue bg-poly-blue text-black' 
                : 'border-black text-black'
            }`}
          >
            LIVE MARKETS
          </button>
        </div>

        <div className="border-2 border-black p-4 max-h-[600px] overflow-y-auto">
          {selectedType === 'trend' && trends.map((trend) => (
            <div
              key={trend.id}
              onClick={() => setSelectedItem(trend)}
              className={`p-3 mb-2 border cursor-pointer ${
                selectedItem?.id === trend.id
                  ? 'border-poly-blue bg-poly-blue/10'
                  : 'border-black/20 hover:border-poly-blue'
              }`}
            >
              <div className="font-semibold text-sm">{trend.title}</div>
              <div className="text-xs text-black/50 mt-1">{trend.source.toUpperCase()}</div>
            </div>
          ))}

          {selectedType === 'market' && markets.map((market) => (
            <div
              key={market.id}
              onClick={() => setSelectedItem(market)}
              className={`p-3 mb-2 border cursor-pointer ${
                selectedItem?.id === market.id
                  ? 'border-poly-blue bg-poly-blue/10'
                  : 'border-black/20 hover:border-poly-blue'
              }`}
            >
              <div className="font-semibold text-sm">{market.question}</div>
              <div className="text-xs text-black/50 mt-1">
                ${(market.volume || 0).toLocaleString()} volume
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={generateMarketing}
          disabled={!selectedItem || generating}
          className="w-full mt-4 px-6 py-3 bg-poly-blue text-black font-bold hover:bg-poly-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? '⏳ GENERATING...' : '✨ GENERATE MARKETING IDEAS'}
        </button>
      </div>

      {/* Right: Analysis */}
      <div>
        <h2 className="text-2xl font-bold mb-4">MARKETING IDEAS</h2>
        <div className="border-2 border-black p-6 min-h-[600px] whitespace-pre-wrap">
          {!analysis && !generating && (
            <div className="text-black/50 text-center py-20">
              Select an item and click "Generate Marketing Ideas" to begin.
            </div>
          )}
          {generating && (
            <div className="text-center py-20">
              <div className="text-xl mb-2">⏳</div>
              <div>Generating marketing ideas...</div>
            </div>
          )}
          {analysis && !generating && (
            <div className="text-sm leading-relaxed">{analysis}</div>
          )}
        </div>
      </div>
    </div>
  );
}
