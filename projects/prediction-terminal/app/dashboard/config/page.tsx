'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PREDICTION_KEYWORDS, EXCLUSION_KEYWORDS } from '@/lib/config/trends';

export default function ConfigPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKeywords, setEditingKeywords] = useState('');
  const [editingExclusions, setEditingExclusions] = useState('');

  const keywords = settings.keywords_prediction || PREDICTION_KEYWORDS;
  const exclusions = settings.keywords_exclusion || EXCLUSION_KEYWORDS;
  const thresholds = {
    reddit: {
      minUpvotes: settings.reddit_min_upvotes || 100,
      minComments: settings.reddit_min_comments || 10,
      minUpvoteRatio: settings.reddit_min_upvote_ratio || 0.6
    },
    x: {
      minLikes: settings.x_min_likes || 50,
      minRetweets: settings.x_min_retweets || 10
    },
    web: {
      minScore: settings.web_min_score || 0.7
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      const settingsObj: any = {};
      data.settings.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });
      
      setSettings(settingsObj);
      // Use database values or fall back to config file defaults
      const keywords = settingsObj.keywords_prediction || PREDICTION_KEYWORDS;
      const exclusions = settingsObj.keywords_exclusion || EXCLUSION_KEYWORDS;
      setEditingKeywords(keywords.join(', '));
      setEditingExclusions(exclusions.join(', '));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      await fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const saveKeywords = () => {
    const keywords = editingKeywords.split(',').map(k => k.trim()).filter(k => k);
    updateSetting('keywords_prediction', keywords);
  };

  const saveExclusions = () => {
    const exclusions = editingExclusions.split(',').map(k => k.trim()).filter(k => k);
    updateSetting('keywords_exclusion', exclusions);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex items-center justify-center">
        <div className="text-xl">LOADING SETTINGS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <div className="border-b border-black bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-black hover:text-poly-blue">
                ← BACK
              </Link>
              <h1 className="text-2xl font-bold tracking-wider">
                CONFIGURATION
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Instructions */}
        <div className="border border-black/30 p-6 mb-8 bg-poly-blue-950/10">
          <h2 className="text-xl font-bold mb-4">📝 HOW TO CUSTOMIZE</h2>
          <p className="mb-4">
            To modify keywords and filters, edit: <code className="text-yellow-400">lib/config/trends.ts</code>
          </p>
          <p className="text-sm text-black/70">
            After making changes, restart the dev server or redeploy to Vercel.
          </p>
        </div>

        {/* Prediction Keywords */}
        <div className="border border-black p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-poly-blue">
            🎯 PREDICTION KEYWORDS ({keywords.length})
          </h2>
          <p className="text-sm mb-4 text-black/70">
            Trends must contain at least one of these keywords to be considered. Add keywords separated by commas.
          </p>
          
          <textarea
            value={editingKeywords}
            onChange={(e) => setEditingKeywords(e.target.value)}
            className="w-full border border-black p-3 mb-4 font-mono text-sm min-h-[120px]"
            placeholder="election, trump, bitcoin, mvp, etc..."
          />
          
          <button
            onClick={saveKeywords}
            disabled={saving}
            className="px-4 py-2 bg-poly-blue text-black font-semibold hover:bg-poly-blue/80 disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE KEYWORDS'}
          </button>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((keyword: string) => (
              <span
                key={keyword}
                className="px-3 py-1 border border-black/50 bg-poly-blue-950/20 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Exclusion Keywords */}
        <div className="border border-red-400 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-red-400">
            ❌ EXCLUSION KEYWORDS ({exclusions.length})
          </h2>
          <p className="text-sm mb-4 text-black/70">
            Trends containing these keywords will be automatically rejected. Add keywords separated by commas.
          </p>
          
          <textarea
            value={editingExclusions}
            onChange={(e) => setEditingExclusions(e.target.value)}
            className="w-full border border-red-400 p-3 mb-4 font-mono text-sm min-h-[80px]"
            placeholder="nsfw, spam, buy my, etc..."
          />
          
          <button
            onClick={saveExclusions}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-black font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE EXCLUSIONS'}
          </button>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {exclusions.map((keyword: string) => (
              <span
                key={keyword}
                className="px-3 py-1 border border-red-400/50 bg-red-950/20 text-sm text-red-400"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Engagement Thresholds */}
        <div className="border border-yellow-400 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">
            📊 ENGAGEMENT THRESHOLDS
          </h2>
          <p className="text-sm mb-4 text-black/70">
            Minimum engagement required for trends to be analyzed
          </p>

          <div className="space-y-4">
            {/* Reddit */}
            <div className="border-l-2 border-yellow-400 pl-4">
              <h3 className="font-bold mb-2 text-yellow-300">🔴 REDDIT</h3>
              <div className="text-sm space-y-1">
                <div>Min Upvotes: {thresholds.reddit.minUpvotes}</div>
                <div>Min Comments: {thresholds.reddit.minComments}</div>
                <div>Min Upvote Ratio: {(thresholds.reddit.minUpvoteRatio * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Twitter */}
            <div className="border-l-2 border-yellow-400 pl-4">
              <h3 className="font-bold mb-2 text-yellow-300">🐦 TWITTER</h3>
              <div className="text-sm space-y-1">
                <div>Min Likes: {thresholds.x.minLikes}</div>
                <div>Min Retweets: {thresholds.x.minRetweets}</div>
              </div>
            </div>

            {/* Web */}
            <div className="border-l-2 border-yellow-400 pl-4">
              <h3 className="font-bold mb-2 text-yellow-300">🌐 WEB</h3>
              <div className="text-sm space-y-1">
                <div>Min Relevance Score: {thresholds.web.minScore}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="border border-black/30 p-6 bg-poly-blue-950/10">
          <h2 className="text-xl font-bold mb-4">💡 CUSTOMIZATION EXAMPLES</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-bold text-poly-blue mb-2">Add Sports Keywords:</div>
              <code className="text-yellow-400">
                'lebron', 'mahomes', 'world cup', 'olympics'
              </code>
            </div>
            <div>
              <div className="font-bold text-poly-blue mb-2">Add Crypto Keywords:</div>
              <code className="text-yellow-400">
                'solana', 'nft', 'defi', 'web3', 'dao'
              </code>
            </div>
            <div>
              <div className="font-bold text-poly-blue mb-2">Exclude Spam:</div>
              <code className="text-red-400">
                'follow me', 'dm for info', 'click here'
              </code>
            </div>
            <div>
              <div className="font-bold text-poly-blue mb-2">Lower Reddit Threshold:</div>
              <code className="text-yellow-400">
                minUpvotes: 50  // Was 100
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
