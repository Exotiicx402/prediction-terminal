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
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">TRENDING TOPICS ({trends.length})</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold"
        >
          🔄 REFRESH
        </button>
      </div>

      {trends.length === 0 ? (
        <div className="text-center py-20 text-black/50">
          No trending topics found. Check back soon.
        </div>
      ) : (
        <div className="grid gap-4">
          {trends.map((trend) => (
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
                    <span className="text-xs text-black/50">
                      {new Date(trend.detected_at).toLocaleString()}
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
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">LIVE POLYMARKET MARKETS ({markets.length})</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold"
        >
          🔄 REFRESH
        </button>
      </div>

      {markets.length === 0 ? (
        <div className="text-center py-20 text-black/50">
          No markets found. Check back soon.
        </div>
      ) : (
        <div className="grid gap-4">
          {markets.map((market) => (
            <div
              key={market.id}
              className="border-2 border-black p-4 hover:border-poly-blue transition-colors"
            >
              <h3 className="text-lg font-bold mb-3">{market.question}</h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-black/50 mb-1">VOLUME</div>
                  <div className="text-lg font-bold">
                    ${(market.volume || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-black/50 mb-1">LIQUIDITY</div>
                  <div className="text-lg font-bold">
                    ${(market.liquidity || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-black/50 mb-1">END DATE</div>
                  <div className="text-sm font-semibold">
                    {market.endDate ? new Date(market.endDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              <a
                href={`https://polymarket.com/event/${market.slug || market.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-poly-blue hover:underline font-semibold text-sm"
              >
                VIEW ON POLYMARKET →
              </a>
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
