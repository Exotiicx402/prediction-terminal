'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKeywords, setEditingKeywords] = useState('');
  const [editingExclusions, setEditingExclusions] = useState('');
  const [editingXAccounts, setEditingXAccounts] = useState('');

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
      setEditingKeywords((settingsObj.keywords_prediction || []).join(', '));
      setEditingExclusions((settingsObj.keywords_exclusion || []).join(', '));
      setEditingXAccounts((settingsObj.x_monitor_accounts || []).join(', '));
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
      alert('Setting saved!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to save setting');
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

  const saveXAccounts = () => {
    const accounts = editingXAccounts.split(',').map(k => k.trim()).filter(k => k);
    updateSetting('x_monitor_accounts', accounts);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-xl">Loading settings...</div>
      </div>
    );
  }

  const keywords = settings.keywords_prediction || [];
  const exclusions = settings.keywords_exclusion || [];
  const xAccounts = settings.x_monitor_accounts || [];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-black bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-poly-blue hover:text-poly-blue-dark transition-colors">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-black">
                ⚙️ Settings
              </h1>
            </div>
            {saving && <div className="text-poly-blue">Saving...</div>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Prediction Keywords */}
        <div className="border border-black bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-black">
            🎯 Prediction Keywords ({keywords.length})
          </h2>
          <p className="text-sm mb-4 text-black">
            Trends must contain at least one of these keywords
          </p>
          
          <textarea
            value={editingKeywords}
            onChange={(e) => setEditingKeywords(e.target.value)}
            className="w-full bg-white border border-black rounded-lg p-3 text-black text-sm mb-4 min-h-[150px] focus:border-poly-blue focus:outline-none"
            placeholder="Enter keywords separated by commas"
          />
          
          <button
            onClick={saveKeywords}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-poly-blue text-white hover:bg-poly-blue-dark transition-colors disabled:opacity-50 font-semibold"
          >
            Save Keywords
          </button>

          <div className="mt-4 pt-4 border-t border-black">
            <div className="text-xs text-black uppercase tracking-wide mb-2">Current Keywords:</div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword: string) => (
                <span
                  key={keyword}
                  className="px-3 py-1 border border-poly-blue/30 bg-poly-blue/10 text-xs text-poly-blue rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Exclusion Keywords */}
        <div className="border border-black bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-black">
            ❌ Exclusion Keywords ({exclusions.length})
          </h2>
          <p className="text-sm mb-4 text-black">
            Trends containing these will be rejected
          </p>
          
          <textarea
            value={editingExclusions}
            onChange={(e) => setEditingExclusions(e.target.value)}
            className="w-full bg-white border border-black rounded-lg p-3 text-black text-sm mb-4 min-h-[100px] focus:border-red-500 focus:outline-none"
            placeholder="Enter exclusion keywords separated by commas"
          />
          
          <button
            onClick={saveExclusions}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 font-semibold"
          >
            Save Exclusions
          </button>

          <div className="mt-4 pt-4 border-t border-black">
            <div className="text-xs text-black uppercase tracking-wide mb-2">Current Exclusions:</div>
            <div className="flex flex-wrap gap-2">
              {exclusions.map((keyword: string) => (
                <span
                  key={keyword}
                  className="px-3 py-1 border border-red-200 bg-red-50 text-xs text-red-600 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Reddit Thresholds */}
        <div className="border border-black bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-black">
            📊 Reddit Thresholds
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-black">Minimum Upvotes</label>
              <input
                type="number"
                value={settings.threshold_reddit_upvotes || 50}
                onChange={(e) => updateSetting('threshold_reddit_upvotes', parseInt(e.target.value))}
                className="bg-white border border-black rounded-lg px-4 py-2 text-black w-32 focus:border-poly-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-black">Minimum Comments</label>
              <input
                type="number"
                value={settings.threshold_reddit_comments || 5}
                onChange={(e) => updateSetting('threshold_reddit_comments', parseInt(e.target.value))}
                className="bg-white border border-black rounded-lg px-4 py-2 text-black w-32 focus:border-poly-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-black">Minimum Upvote Ratio (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.threshold_reddit_ratio || 0.6}
                onChange={(e) => updateSetting('threshold_reddit_ratio', parseFloat(e.target.value))}
                className="bg-white border border-black rounded-lg px-4 py-2 text-black w-32 focus:border-poly-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* X Accounts */}
        <div className="border border-black bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-black">
            𝕏 Monitored Accounts ({xAccounts.length})
          </h2>
          <p className="text-sm mb-4 text-black">
            X/Twitter accounts to monitor for trending topics (via Nitter RSS)
          </p>
          
          <textarea
            value={editingXAccounts}
            onChange={(e) => setEditingXAccounts(e.target.value)}
            className="w-full bg-white border border-black rounded-lg p-3 text-black text-sm mb-4 min-h-[100px] focus:border-poly-blue focus:outline-none"
            placeholder="Enter X account handles separated by commas (without @)"
          />
          
          <button
            onClick={saveXAccounts}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-poly-blue text-white hover:bg-poly-blue-dark transition-colors disabled:opacity-50 font-semibold"
          >
            Save X Accounts
          </button>

          <div className="mt-4 pt-4 border-t border-black">
            <div className="text-xs text-black uppercase tracking-wide mb-2">Current Accounts:</div>
            <div className="flex flex-wrap gap-2">
              {xAccounts.map((account: string) => (
                <span
                  key={account}
                  className="px-3 py-1 border border-poly-blue/30 bg-poly-blue/10 text-xs text-poly-blue rounded-full"
                >
                  @{account}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="font-bold mb-2 text-black">💡 Suggested Accounts:</div>
            <div className="text-black space-y-1">
              <div>• Breaking News: breakingnews, CNNBreaking, BBCBreaking, Reuters, AP</div>
              <div>• Business: business, markets, WSJ, Bloomberg</div>
              <div>• Crypto: elonmusk, VitalikButerin, CoinDesk</div>
              <div>• Politics: POTUS, WhiteHouse, TheEconomist</div>
              <div>• Sports: ESPN, BleacherReport, SportsCenter</div>
              <div>• Polymarket: polymarket</div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="border border-black bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-black">💡 Tips</h2>
          <div className="space-y-2 text-sm text-black">
            <p>• Separate keywords with commas</p>
            <p>• Lower thresholds = more trends detected</p>
            <p>• Higher thresholds = only viral content</p>
            <p>• Changes take effect immediately</p>
            <p>• Click "Save" after editing each section</p>
          </div>
        </div>
      </div>
    </div>
  );
}
