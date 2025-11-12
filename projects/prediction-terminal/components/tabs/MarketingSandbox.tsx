'use client';

import { useState, useEffect } from 'react';

interface TrendingPost {
  id: string;
  title: string;
  source: string;
  author: string;
  engagement_score: number;
  url: string;
  detected_at: string;
}

interface Market {
  id: string;
  question: string;
  category: string;
  volume: number;
  current_odds: number;
  end_date: string;
  market_url: string;
}

export default function MarketingSandbox() {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedTrendId, setSelectedTrendId] = useState<string>('');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [generatedAngles, setGeneratedAngles] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Fetch trending posts on mount
  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  // Fetch markets on mount
  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchTrendingPosts = async () => {
    try {
      const response = await fetch('/api/trending-posts?limit=50');
      const data = await response.json();
      setTrendingPosts(data.trends || []);
    } catch (err) {
      console.error('Error fetching trending posts:', err);
    }
  };

  const fetchMarkets = async () => {
    try {
      const response = await fetch('/api/markets?sort=volume&limit=50');
      const data = await response.json();
      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTrendId && !selectedMarketId) {
      setError('Please select at least a trending topic or a market.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedAngles('');

    try {
      // Generation logic will be implemented here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Placeholder
      setGeneratedAngles('Creative angles will appear here after generation is implemented.');
    } catch (err) {
      console.error('Error generating angles:', err);
      setError('Failed to generate creative angles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!generatedAngles) return;
    
    navigator.clipboard.writeText(generatedAngles).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const selectedTrend = trendingPosts.find(t => t.id === selectedTrendId);
  const selectedMarket = markets.find(m => m.id === selectedMarketId);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Panel: Input Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-6">SELECT CONTENT</h2>

        {/* Trending Topic Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            SELECT TRENDING TOPIC
          </label>
          <select
            value={selectedTrendId}
            onChange={(e) => setSelectedTrendId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black font-mono text-sm bg-white"
          >
            <option value="">-- None Selected --</option>
            {trendingPosts.map((trend) => (
              <option key={trend.id} value={trend.id}>
                [{trend.source.toUpperCase()}] {trend.title.slice(0, 80)}
                {trend.title.length > 80 ? '...' : ''}
              </option>
            ))}
          </select>
          
          {/* Selected Trend Preview */}
          {selectedTrend && (
            <div className="mt-3 p-3 border-2 border-poly-blue bg-poly-blue/5">
              <div className="text-xs font-semibold text-black/60 mb-1">
                {selectedTrend.source.toUpperCase()} • r/{selectedTrend.author}
              </div>
              <div className="text-sm font-bold mb-2">{selectedTrend.title}</div>
              <div className="text-xs text-black/60">
                ⬆️ {selectedTrend.engagement_score.toLocaleString()} upvotes
              </div>
            </div>
          )}
        </div>

        {/* Market Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            SELECT MARKET
          </label>
          <select
            value={selectedMarketId}
            onChange={(e) => setSelectedMarketId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black font-mono text-sm bg-white"
          >
            <option value="">-- None Selected --</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.question.slice(0, 80)}
                {market.question.length > 80 ? '...' : ''}
              </option>
            ))}
          </select>

          {/* Selected Market Preview */}
          {selectedMarket && (
            <div className="mt-3 p-3 border-2 border-poly-blue bg-poly-blue/5">
              <div className="text-xs font-semibold text-black/60 mb-1">
                {selectedMarket.category?.toUpperCase() || 'MARKET'}
              </div>
              <div className="text-sm font-bold mb-2">{selectedMarket.question}</div>
              <div className="text-xs text-black/60">
                ${(selectedMarket.volume || 0).toLocaleString()} volume • 
                {selectedMarket.current_odds 
                  ? ` ${Math.round((selectedMarket.current_odds || 0) * 100)}% odds`
                  : ' N/A'
                }
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || (!selectedTrendId && !selectedMarketId)}
          className="w-full px-6 py-4 bg-poly-blue text-black font-bold text-lg border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-poly-blue disabled:hover:text-black"
        >
          {loading ? '⏳ GENERATING...' : '✨ GENERATE CREATIVE ANGLES'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 border-2 border-red-600 bg-red-50 text-red-600 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Right Panel: Generated Output */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">CREATIVE ANGLES</h2>
          {generatedAngles && !loading && (
            <button
              onClick={handleCopyAll}
              className="px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-semibold text-sm"
            >
              {copySuccess ? '✓ COPIED!' : '📋 COPY ALL'}
            </button>
          )}
        </div>

        <div className="border-2 border-black p-6 min-h-[600px] bg-white font-mono text-sm">
          {!generatedAngles && !loading && (
            <div className="flex items-center justify-center h-full text-black/50 text-center">
              <div>
                <div className="text-4xl mb-4">💡</div>
                <div>Select a trending topic and/or market,</div>
                <div>then click "Generate Creative Angles" to begin.</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">⏳</div>
                <div className="text-lg font-semibold">Generating creative angles...</div>
                <div className="text-sm text-black/50 mt-2">This may take a moment</div>
              </div>
            </div>
          )}

          {generatedAngles && !loading && (
            <div className="whitespace-pre-wrap leading-relaxed">
              {generatedAngles}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
