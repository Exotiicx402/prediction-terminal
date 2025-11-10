import { HighPotentialTrend } from '@/lib/types/database';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

interface TrendCardProps {
  trend: HighPotentialTrend;
}

export default function TrendCard({ trend }: TrendCardProps) {
  const potentialColors = {
    high: 'border-red-200 bg-white',
    medium: 'border-yellow-200 bg-white',
    low: 'border-blue-200 bg-white',
    none: 'border-black bg-white',
  };

  const potentialBadgeColors = {
    high: 'bg-red-100 text-red-600 border-red-300',
    medium: 'bg-yellow-100 text-yellow-600 border-yellow-300',
    low: 'bg-blue-100 text-blue-600 border-blue-300',
    none: 'bg-white text-black border-black',
  };

  const sourceIcons: Record<string, React.ReactElement> = {
    reddit: <img src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762753040/reddit-svgrepo-com_nmgvwi.svg" alt="Reddit" className="w-5 h-5" />,
    x: <span className="text-xl">𝕏</span>,
    web: <span className="text-xl">🌐</span>,
  };

  const cardColor = potentialColors[trend.market_potential] || potentialColors.none;
  const badgeColor = potentialBadgeColors[trend.market_potential] || potentialBadgeColors.none;

  return (
    <div className={`border ${cardColor} rounded-xl p-6 hover:border-poly-blue transition-all duration-200 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {sourceIcons[trend.source]}
            <span className="text-xs uppercase font-semibold tracking-wider text-black">
              {trend.source}
            </span>
            <span className={`text-xs uppercase font-semibold tracking-wider px-2 py-1 rounded-full border ${badgeColor}`}>
              {trend.market_potential}
            </span>
          </div>
          <h2 className="text-lg font-bold mb-2 text-black leading-tight">
            {trend.title}
          </h2>
          <p className="text-sm text-black leading-relaxed">
            {trend.summary}
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-4xl font-bold text-black">
            {Math.round(trend.confidence_score * 100)}%
          </div>
          <div className="text-xs text-black uppercase tracking-wide">Confidence</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-black">
        <div>
          <div className="text-xs text-black uppercase tracking-wide mb-1">Engagement</div>
          <div className="text-lg font-bold text-black">
            {trend.engagement_score.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-black uppercase tracking-wide mb-1">Detected</div>
          <div className="text-sm text-black">
            {formatDistanceToNow(new Date(trend.detected_at), {
              addSuffix: true,
            })}
          </div>
        </div>
        <div>
          <div className="text-xs text-black uppercase tracking-wide mb-1">Status</div>
          <div className="text-sm uppercase text-black">
            {trend.alerted_at ? '✓ Alerted' : 'Analyzed'}
          </div>
        </div>
      </div>

      {/* Suggested Markets */}
      {trend.suggested_markets && trend.suggested_markets.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-black uppercase tracking-wider mb-2">
            📊 Suggested Markets
          </div>
          {trend.suggested_markets.map((market, index) => (
            <div
              key={index}
              className="border-l-2 border-poly-blue bg-blue-50 pl-4 py-3 rounded-r"
            >
              <div className="font-semibold text-black mb-2 text-sm">
                {market.question}
              </div>
              <div className="text-xs text-black space-y-1">
                <div><span className="text-black font-semibold">Type:</span> {market.market_type.toUpperCase()}</div>
                <div><span className="text-black font-semibold">Resolution:</span> {market.resolution_criteria}</div>
                <div>
                  <span className="text-black font-semibold">Est. Liquidity:</span>{' '}
                  <span className="uppercase">{market.estimated_liquidity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-black flex justify-between items-center text-xs">
        <div className="text-black">
          {trend.author && `by ${trend.author}`}
        </div>
        {trend.url && (
          <a
            href={trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline transition-colors font-semibold"
          >
            View Source →
          </a>
        )}
      </div>
    </div>
  );
}
