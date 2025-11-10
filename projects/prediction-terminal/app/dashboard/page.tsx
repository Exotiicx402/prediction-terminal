'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { HighPotentialTrend, SourceMetadata } from '@/lib/types/database';
import TrendCard from '@/components/trends/TrendCard';
import StatsBar from '@/components/trends/StatsBar';
import FilterBar from '@/components/trends/FilterBar';

export default function DashboardPage() {
  const [trends, setTrends] = useState<HighPotentialTrend[]>([]);
  const [sourceMetadata, setSourceMetadata] = useState<SourceMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'none'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'reddit' | 'x' | 'web'>('all');

  useEffect(() => {
    fetchTrends();
    fetchSourceMetadata();

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up real-time subscription
    const channel = supabase
      .channel('trends-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trends' },
        () => {
          fetchTrends();
        }
      )
      .subscribe();

    return () => {
      clearInterval(clockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTrends = async () => {
    try {
      // Fetch ALL analyzed trends with their analysis
      const { data: trendsData, error } = await supabase
        .from('trends')
        .select(`
          *,
          analyses (*)
        `)
        .eq('status', 'analyzed')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform to match HighPotentialTrend format
      const transformed = trendsData?.map((t: any) => ({
        ...t,
        market_potential: t.analyses[0]?.market_potential || 'none',
        confidence_score: t.analyses[0]?.confidence_score || 0,
        summary: t.analyses[0]?.summary || '',
        suggested_markets: t.analyses[0]?.suggested_markets || [],
      })) || [];
      
      setTrends(transformed);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('source_metadata')
        .select('*');

      if (error) throw error;
      setSourceMetadata(data || []);
    } catch (error) {
      console.error('Error fetching source metadata:', error);
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/trigger-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'all' })
      });
      
      if (response.ok) {
        // Wait a moment for scans to complete, then refresh
        setTimeout(() => {
          fetchTrends();
          fetchSourceMetadata();
          setScanning(false);
        }, 3000);
      } else {
        setScanning(false);
      }
    } catch (error) {
      console.error('Error triggering scan:', error);
      setScanning(false);
    }
  };

  const filteredTrends = trends.filter((trend) => {
    const potentialMatch = filter === 'all' || trend.market_potential === filter;
    const sourceMatch = sourceFilter === 'all' || trend.source === sourceFilter;
    return potentialMatch && sourceMatch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762752805/logo-black_xgggh7.svg" 
                  alt="Polymarket" 
                  className="h-8"
                />
                <span className="text-xs text-black">Prediction Terminal</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-black">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-black">LIVE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="text-sm px-4 py-2 rounded-lg bg-white border-2 border-poly-blue text-black hover:border-black transition-colors font-semibold disabled:opacity-50"
              >
                {scanning ? '⏳ Scanning...' : '🔍 Scan Now'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm px-4 py-2 rounded-lg bg-white border-2 border-poly-blue text-black hover:border-black transition-colors font-semibold"
              >
                🔄 Refresh
              </button>
              <Link
                href="/sandbox"
                className="text-sm px-4 py-2 rounded-lg bg-white border border-black text-black hover:bg-white transition-colors"
              >
                🎨 Sandbox
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-sm px-4 py-2 rounded-lg bg-white border border-black text-black hover:bg-white transition-colors"
              >
                ⚙️ Settings
              </Link>
              <div className="text-xs text-black" suppressHydrationWarning>
                {currentTime.toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar trends={trends} sourceMetadata={sourceMetadata} />

      {/* Filters */}
      <FilterBar
        filter={filter}
        sourceFilter={sourceFilter}
        onFilterChange={setFilter}
        onSourceFilterChange={setSourceFilter}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl animate-spin text-poly-blue">⟳</div>
              <div className="text-sm text-black">Scanning markets...</div>
            </div>
          </div>
        ) : filteredTrends.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-xl text-black font-semibold">No Opportunities Detected</div>
            <div className="text-sm text-black mt-2">
              System scanning in progress
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {filteredTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
