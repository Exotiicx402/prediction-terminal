'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  volume: number;
  liquidity: number;
  active: boolean;
  endDate: string;
  outcomes: string[];
  slug: string;
}

interface TrendingPost {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  author: string;
  engagement_score: number;
  detected_at: string;
}

export default function SandboxPage() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Polymarket markets via our API route
      const marketsRes = await fetch('/api/polymarket-markets');
      const marketsData = await marketsRes.json();
      
      setMarkets(marketsData.map((m: any) => ({
        id: m.id,
        question: m.question,
        description: m.description || '',
        volume: m.volume || 0,
        liquidity: m.liquidity || 0,
        active: m.active,
        endDate: m.endDate,
        outcomes: m.outcomes || ['Yes', 'No'],
        slug: m.slug || m.id,
      })));

      // Fetch trending posts from our database
      const postsRes = await fetch('/api/trending-posts');
      const postsData = await postsRes.json();
      setPosts(postsData.trends || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets.filter(m => 
    searchTerm === '' || 
    m.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRelatedPosts = (market: PolymarketMarket) => {
    const keywords = market.question.toLowerCase().split(' ').filter(w => w.length > 3);
    return posts.filter(post => {
      const postText = `${post.title} ${post.content}`.toLowerCase();
      return keywords.some(keyword => postText.includes(keyword));
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">🎨 Creative Sandbox</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="text-sm px-4 py-2 rounded-lg bg-white border-2 border-poly-blue text-black hover:border-black transition-colors font-semibold"
              >
                🔄 Refresh
              </button>
              <Link
                href="/dashboard"
                className="text-sm px-4 py-2 rounded-lg bg-white border border-black text-black hover:bg-white transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-4 border-b border-black">
        <input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border-2 border-black rounded-lg text-black focus:border-poly-blue focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-black">Loading markets and trends...</div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markets Column */}
            <div>
              <h2 className="text-xl font-bold text-black mb-4">
                Live Polymarket Markets ({filteredMarkets.length})
              </h2>
              <div className="space-y-4">
                {filteredMarkets.map((market) => {
                  const relatedPosts = getRelatedPosts(market);
                  return (
                    <div
                      key={market.id}
                      onClick={() => setSelectedMarket(market)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedMarket?.id === market.id
                          ? 'border-poly-blue bg-blue-50'
                          : 'border-black hover:border-poly-blue'
                      }`}
                    >
                      <div className="font-bold text-black mb-2">{market.question}</div>
                      <div className="text-sm text-black mb-2">
                        Volume: ${(market.volume / 1000).toFixed(1)}k | Liquidity: ${(market.liquidity / 1000).toFixed(1)}k
                      </div>
                      {relatedPosts.length > 0 && (
                        <div className="text-xs text-poly-blue font-semibold">
                          💡 {relatedPosts.length} related trending post{relatedPosts.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      <a
                        href={`https://polymarket.com/event/${market.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-poly-blue hover:underline mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Polymarket →
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trending Posts Column */}
            <div>
              <h2 className="text-xl font-bold text-black mb-4">
                {selectedMarket ? 'Related Trending Posts' : 'All Trending Posts'} ({selectedMarket ? getRelatedPosts(selectedMarket).length : posts.length})
              </h2>
              
              {selectedMarket && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-poly-blue rounded-xl">
                  <div className="text-sm font-semibold text-black mb-2">Selected Market:</div>
                  <div className="text-black">{selectedMarket.question}</div>
                </div>
              )}

              <div className="space-y-4">
                {(selectedMarket ? getRelatedPosts(selectedMarket) : posts).map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-black rounded-xl p-4 hover:border-poly-blue transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762753040/reddit-svgrepo-com_nmgvwi.svg" 
                        alt="Reddit" 
                        className="w-4 h-4" 
                      />
                      <span className="text-xs font-semibold text-black uppercase">{post.source}</span>
                      <span className="text-xs text-black">• {post.engagement_score.toLocaleString()} engagement</span>
                    </div>
                    <div className="font-bold text-black mb-2">{post.title}</div>
                    {post.content && (
                      <div className="text-sm text-black mb-2 line-clamp-2">{post.content}</div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-black">by {post.author}</span>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-poly-blue hover:underline font-semibold"
                        >
                          View Source →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
