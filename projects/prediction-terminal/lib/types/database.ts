export type SourceType = 'reddit' | 'x' | 'web';
export type TrendStatus = 'pending' | 'analyzing' | 'analyzed' | 'alerted' | 'dismissed';
export type MarketPotential = 'high' | 'medium' | 'low' | 'none';

export interface Trend {
  id: string;
  source: SourceType;
  source_id: string;
  title: string;
  content?: string;
  url?: string;
  author?: string;
  engagement_score: number;
  velocity_score?: number;
  detected_at: string;
  status: TrendStatus;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  trend_id: string;
  market_potential: MarketPotential;
  confidence_score: number;
  summary: string;
  reasoning: string;
  suggested_markets?: SuggestedMarket[];
  keywords?: string[];
  analyzed_at: string;
  created_at: string;
}

export interface SuggestedMarket {
  question: string;
  market_type: 'binary' | 'multiple_choice' | 'scalar';
  options?: string[];
  resolution_criteria: string;
  estimated_liquidity: 'high' | 'medium' | 'low';
}

export interface Alert {
  id: string;
  trend_id: string;
  analysis_id: string;
  slack_channel: string;
  slack_timestamp?: string;
  sent_at: string;
  created_at: string;
}

export interface SourceMetadata {
  id: string;
  source: SourceType;
  last_scan_at?: string;
  last_scan_status?: string;
  trends_found: number;
  api_calls_today: number;
  api_limit_daily?: number;
  created_at: string;
  updated_at: string;
}

export interface HighPotentialTrend extends Trend {
  market_potential: MarketPotential;
  confidence_score: number;
  summary: string;
  suggested_markets?: SuggestedMarket[];
  alerted_at?: string;
}
