'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Keyword {
  id: string;
  keyword: string;
  slug: string;
  intent: string;
  status: 'AVAILABLE' | 'RESERVED' | 'USED';
  source: 'MANUAL' | 'SEED' | 'AUTO' | 'AUTO_REFILL';
  used: boolean;
  createdAt: string;
  niche: { name: string; slug: string };
}

interface Niche {
  id: string;
  name: string;
  slug: string;
  _count?: { keywords: number; articles: number };
}

interface Stats {
  total: number;
  available: number;
  used: number;
  reserved: number;
  bySource: {
    MANUAL: number;
    SEED: number;
    AUTO: number;
    AUTO_REFILL: number;
  };
}

export default function KeywordsPage() {
  const [secret, setSecret] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [niches, setNiches] = useState<Niche[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Add keyword form
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordNiche, setNewKeywordNiche] = useState('');
  const [addStatus, setAddStatus] = useState('');
  
  // Bulk add
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [bulkNiche, setBulkNiche] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // New niche form
  const [newNicheName, setNewNicheName] = useState('');
  const [newNicheSlug, setNewNicheSlug] = useState('');
  const [newNicheDesc, setNewNicheDesc] = useState('');
  const [nicheStatus, setNicheStatus] = useState('');

  const fetchNiches = useCallback(async () => {
    try {
      const data = await api.getAdminNiches(secret);
      setNiches(data.niches || []);
    } catch (err: any) {
      console.error('Failed to fetch niches:', err);
    }
  }, [secret]);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getKeywords(secret, selectedNiche || undefined, statusFilter || undefined);
      setKeywords(data.keywords || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [secret, selectedNiche, statusFilter]);

  useEffect(() => {
    if (isUnlocked) {
      fetchNiches();
      fetchKeywords();
    }
  }, [isUnlocked, fetchNiches, fetchKeywords]);

  const unlock = () => {
    if (secret) {
      setIsUnlocked(true);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newKeywordNiche) {
      setAddStatus('❌ Keyword and niche are required');
      return;
    }
    setAddStatus('Adding...');
    try {
      await api.createKeyword(secret, { nicheId: newKeywordNiche, keyword: newKeyword.trim() });
      setAddStatus('✅ Keyword added!');
      setNewKeyword('');
      fetchKeywords();
    } catch (err: any) {
      setAddStatus(`❌ ${err.message}`);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkKeywords.trim() || !bulkNiche) {
      setBulkStatus('❌ Keywords and niche are required');
      return;
    }
    
    const keywordList = bulkKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length >= 3);
    
    if (keywordList.length === 0) {
      setBulkStatus('❌ No valid keywords found (min 3 chars each)');
      return;
    }

    setBulkStatus('Adding...');
    try {
      const result = await api.bulkCreateKeywords(secret, bulkNiche, keywordList);
      setBulkStatus(`✅ Created: ${result.created}, Skipped: ${result.skipped}`);
      setBulkKeywords('');
      fetchKeywords();
    } catch (err: any) {
      setBulkStatus(`❌ ${err.message}`);
    }
  };

  const handleCreateNiche = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNicheName.trim() || !newNicheSlug.trim()) {
      setNicheStatus('❌ Name and slug are required');
      return;
    }
    setNicheStatus('Creating...');
    try {
      await api.createNiche(secret, {
        name: newNicheName.trim(),
        slug: newNicheSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newNicheDesc.trim() || undefined,
      });
      setNicheStatus('✅ Niche created! Keywords being generated in background.');
      setNewNicheName('');
      setNewNicheSlug('');
      setNewNicheDesc('');
      fetchNiches();
    } catch (err: any) {
      setNicheStatus(`❌ ${err.message}`);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`Delete keyword "${keyword}"?`)) return;
    try {
      await api.deleteKeyword(secret, id);
      fetchKeywords();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateKeyword(secret, id, newStatus);
      fetchKeywords();
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800',
      RESERVED: 'bg-yellow-100 text-yellow-800',
      USED: 'bg-slate-100 text-slate-600',
    };
    return colors[status] || 'bg-slate-100 text-slate-600';
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      MANUAL: 'bg-indigo-100 text-indigo-700',
      SEED: 'bg-purple-100 text-purple-700',
      AUTO: 'bg-blue-100 text-blue-700',
      AUTO_REFILL: 'bg-cyan-100 text-cyan-700',
    };
    return colors[source] || 'bg-slate-100 text-slate-600';
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Keyword Management</h1>
            <p className="text-slate-500 text-sm mt-2">Enter your admin secret to continue</p>
          </div>
          <input
            type="password"
            className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Enter Admin Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && unlock()}
          />
          <button
            onClick={unlock}
            className="w-full bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-slate-900">🔑 Keyword<span className="text-indigo-600">Manager</span></h1>
              <Link href="/admin" className="text-sm text-slate-500 hover:text-indigo-600">← Back to Admin</Link>
            </div>
            <button onClick={() => setIsUnlocked(false)} className="text-sm text-slate-500 hover:text-slate-800">
              Lock Session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-500">Total</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-slate-500">Available</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-500">{stats.used}</div>
              <div className="text-sm text-slate-500">Used</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
              <div className="text-sm text-slate-500">Reserved</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-100">
              <div className="text-sm font-semibold text-indigo-600">By Source</div>
              <div className="text-xs text-slate-500 mt-1">
                M:{stats.bySource.MANUAL} S:{stats.bySource.SEED} A:{stats.bySource.AUTO} R:{stats.bySource.AUTO_REFILL}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Keyword List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Filters */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4">
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">All Niches</option>
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="USED">Used</option>
                </select>
                <button
                  onClick={fetchKeywords}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Refresh
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">{error}</div>
                ) : keywords.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No keywords found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Keyword</th>
                        <th className="px-4 py-3 text-left">Niche</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Source</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {keywords.map((kw) => (
                        <tr key={kw.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{kw.keyword}</div>
                            <div className="text-xs text-slate-400">{kw.slug}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{kw.niche?.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(kw.status)}`}>
                              {kw.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadge(kw.source)}`}>
                              {kw.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {kw.status !== 'USED' && (
                                <select
                                  value=""
                                  onChange={(e) => e.target.value && handleStatusChange(kw.id, e.target.value)}
                                  className="text-xs border rounded px-1 py-0.5"
                                >
                                  <option value="">Change</option>
                                  {kw.status !== 'AVAILABLE' && <option value="AVAILABLE">Available</option>}
                                  {kw.status !== 'RESERVED' && <option value="RESERVED">Reserved</option>}
                                </select>
                              )}
                              <button
                                onClick={() => handleDelete(kw.id, kw.keyword)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right: Forms */}
          <div className="space-y-6">
            {/* Create Niche */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">➕ Create Niche</h2>
              <form onSubmit={handleCreateNiche} className="space-y-3">
                <input
                  type="text"
                  placeholder="Niche Name"
                  value={newNicheName}
                  onChange={(e) => setNewNicheName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Slug (e.g., personal-finance)"
                  value={newNicheSlug}
                  onChange={(e) => setNewNicheSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newNicheDesc}
                  onChange={(e) => setNewNicheDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm">
                  Create Niche
                </button>
                {nicheStatus && (
                  <div className={`text-sm ${nicheStatus.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
                    {nicheStatus}
                  </div>
                )}
              </form>
              <p className="text-xs text-slate-400 mt-2">Keywords will be auto-generated for new niches.</p>
            </div>

            {/* Add Single Keyword */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">🔑 Add Keyword</h2>
              <form onSubmit={handleAddKeyword} className="space-y-3">
                <select
                  value={newKeywordNiche}
                  onChange={(e) => setNewKeywordNiche(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Niche</option>
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Enter keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">
                  Add Keyword
                </button>
                {addStatus && (
                  <div className={`text-sm ${addStatus.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
                    {addStatus}
                  </div>
                )}
              </form>
            </div>

            {/* Bulk Add */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">📋 Bulk Add Keywords</h2>
              <form onSubmit={handleBulkAdd} className="space-y-3">
                <select
                  value={bulkNiche}
                  onChange={(e) => setBulkNiche(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Niche</option>
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Enter keywords, one per line..."
                  value={bulkKeywords}
                  onChange={(e) => setBulkKeywords(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 text-sm">
                  Bulk Add Keywords
                </button>
                {bulkStatus && (
                  <div className={`text-sm ${bulkStatus.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
                    {bulkStatus}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
