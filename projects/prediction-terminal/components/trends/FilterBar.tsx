interface FilterBarProps {
  filter: 'all' | 'high' | 'medium' | 'low' | 'none';
  sourceFilter: 'all' | 'reddit' | 'x' | 'web';
  onFilterChange: (filter: 'all' | 'high' | 'medium' | 'low' | 'none') => void;
  onSourceFilterChange: (filter: 'all' | 'reddit' | 'x' | 'web') => void;
}

export default function FilterBar({
  filter,
  sourceFilter,
  onFilterChange,
  onSourceFilterChange,
}: FilterBarProps) {
  const potentialFilters: Array<'all' | 'high' | 'medium' | 'low' | 'none'> = ['all', 'high', 'medium', 'low', 'none'];
  const sourceFilters: Array<'all' | 'reddit' | 'x' | 'web'> = [
    'all',
    'reddit',
    'x',
    'web',
  ];

  return (
    <div className="border-b border-black bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          {/* Potential Filter */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-black uppercase tracking-wider font-semibold">
              Potential:
            </span>
            <div className="flex gap-2">
              {potentialFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  className={`px-4 py-2 text-xs uppercase font-semibold tracking-wider rounded-lg border transition-all text-black ${
                    filter === f
                      ? 'bg-white border-poly-blue border-2'
                      : 'bg-white border-black hover:border-poly-blue'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-black uppercase tracking-wider font-semibold">
              Source:
            </span>
            <div className="flex gap-2">
              {sourceFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => onSourceFilterChange(s)}
                  className={`px-4 py-2 text-xs uppercase font-semibold tracking-wider rounded-lg border transition-all flex items-center gap-2 text-black ${
                    sourceFilter === s
                      ? 'bg-white border-poly-blue border-2'
                      : 'bg-white border-black hover:border-poly-blue'
                  }`}
                >
                  {s === 'reddit' && <img src="https://res.cloudinary.com/dy1nbfg5g/image/upload/v1762753040/reddit-svgrepo-com_nmgvwi.svg" alt="Reddit" className="w-4 h-4" />}
                  {s === 'x' && <span>𝕏</span>}
                  {s === 'web' && <span>🌐</span>}
                  {s === 'x' ? 'X' : s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
