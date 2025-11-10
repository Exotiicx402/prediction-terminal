import { HighPotentialTrend, SourceMetadata } from '@/lib/types/database';

interface StatsBarProps {
  trends: HighPotentialTrend[];
  sourceMetadata: SourceMetadata[];
}

export default function StatsBar({ trends, sourceMetadata }: StatsBarProps) {
  const highPotential = trends.filter((t) => t.market_potential === 'high').length;
  const mediumPotential = trends.filter((t) => t.market_potential === 'medium').length;

  return (
    <div className="border-b border-black bg-white">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-8 text-xs">
          {/* Total Trends */}
          <div className="flex items-center gap-2">
            <span className="text-black uppercase tracking-wide">Total Trends</span>
            <span className="text-lg font-bold text-black">{trends.length}</span>
          </div>

          {/* High Potential */}
          <div className="flex items-center gap-2">
            <span className="text-black uppercase tracking-wide">High Potential</span>
            <span className="text-lg font-bold text-red-600">{highPotential}</span>
          </div>

          {/* Medium Potential */}
          <div className="flex items-center gap-2">
            <span className="text-black uppercase tracking-wide">Medium Potential</span>
            <span className="text-lg font-bold text-yellow-600">{mediumPotential}</span>
          </div>

          {/* Source Stats */}
          {sourceMetadata.map((source) => (
            <div key={source.source} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {source.source === 'reddit' && <img src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762753040/reddit-svgrepo-com_nmgvwi.svg" alt="Reddit" className="w-4 h-4" />}
                {source.source === 'x' && <span>𝕏</span>}
                {source.source === 'web' && <span>🌐</span>}
                <span className="text-black uppercase tracking-wide">
                  {source.source === 'x' ? 'X' : source.source.toUpperCase()}
                </span>
              </div>
              <span className="text-lg font-bold">
                {source.last_scan_status === 'success' ? (
                  <span className="text-poly-blue">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
