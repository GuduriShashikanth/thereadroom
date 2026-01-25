'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authStatus, setAuthStatus] = useState<'locked' | 'unlocked'>('locked');
  const [activeTab, setActiveTab] = useState<'generate' | 'manual' | 'upload'>('generate');

  // Generation State
  const [genNiche, setGenNiche] = useState('');
  const [genKeyword, setGenKeyword] = useState('');
  const [genStatus, setGenStatus] = useState('');

  // Manual Creation State
  const [manualTitle, setManualTitle] = useState('');
  const [manualNiche, setManualNiche] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualStatus, setManualStatus] = useState('');

  // Upload State
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastUploadedUrl, setLastUploadedUrl] = useState('');

  const unlock = () => {
    if (secret) setAuthStatus('unlocked');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenStatus('Triggering...');
    try {
      await api.triggerGeneration(genNiche, genKeyword, secret);
      setGenStatus('✅ Success! Job queued.');
      setGenKeyword('');
    } catch (err: any) {
      setGenStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStatus('Saving...');
    try {
      await api.createArticle({
        title: manualTitle,
        niche: manualNiche,
        content: manualContent,
        metaDescription: manualDesc,
        secret
      } as any);
      setManualStatus('✅ Article created!');
      setManualTitle('');
      setManualContent('');
    } catch (err: any) {
      setManualStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading image...');
    try {
      const res = await api.uploadImage(file, secret);
      const fullUrl = `http://localhost:3001${res.url}`;
      setLastUploadedUrl(fullUrl);
      setUploadStatus('✅ Image uploaded!');
    } catch (err: any) {
      setUploadStatus(`❌ Upload Error: ${err.message}`);
    }
  };

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Importing markdown...');
    try {
      await api.importMarkdown(file, secret);
      setUploadStatus('✅ Article imported successfully!');
    } catch (err: any) {
      setUploadStatus(`❌ Import Error: ${err.message}`);
    }
  };

  if (authStatus === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
            <p className="text-slate-500 text-sm mt-2">Enter your secret key to continue</p>
          </div>
          <input
            type="password"
            className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            placeholder="Enter Admin Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <button
            onClick={unlock}
            className="w-full bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Unlock Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Admin<span className="text-indigo-600">Dashboard</span></h1>
            <button 
              onClick={() => setAuthStatus('locked')} 
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Lock Session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'generate' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              ✨ AI Generator
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'manual' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              ✍️ Manual Post
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'upload' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              📤 Uploads
            </button>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'generate' ? (
              <form onSubmit={handleGenerate} className="space-y-6 max-w-lg mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Auto-Generate Content</h2>
                  <p className="text-slate-500 text-sm">Fill in the details to trigger a new AI article.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Niche</label>
                  <input
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={genNiche}
                    onChange={e => setGenNiche(e.target.value)}
                    placeholder="e.g. Technology"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Keyword</label>
                  <input
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={genKeyword}
                    onChange={e => setGenKeyword(e.target.value)}
                    placeholder="e.g. Future of AI"
                    required
                  />
                </div>

                <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                  🚀 Generate Content
                </button>

                {genStatus && (
                  <div className={`p-4 rounded-lg text-sm font-medium text-center ${genStatus.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {genStatus}
                  </div>
                )}
              </form>
            ) : activeTab === 'manual' ? (
              <form onSubmit={handleManualCreate} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Create New Article</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Niche</label>
                    <input
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={manualNiche}
                      onChange={e => setManualNiche(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                  <input
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Content (Markdown)</label>
                  <textarea
                    className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm h-96 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={manualContent}
                    onChange={e => setManualContent(e.target.value)}
                    placeholder="# Your awesome content here..."
                    required
                  />
                </div>

                <button className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-sm">
                  Publlish Article
                </button>

                {manualStatus && (
                  <div className={`p-4 rounded-lg text-sm font-medium text-center ${manualStatus.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {manualStatus}
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-8 max-w-xl mx-auto">
                <div className="border border-dashed border-slate-300 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors group cursor-pointer relative">
                  <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">🖼️</div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">Upload Image</h3>
                  <p className="text-slate-500 text-sm mb-6">Support for PNG, JPG (Max 5MB)</p>
                  
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none inline-block bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 shadow-sm">
                    Select File
                  </div>
                  
                  {lastUploadedUrl && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-left overflow-hidden">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Public URL</p>
                      <code className="text-xs text-indigo-600 break-all select-all font-mono block">{lastUploadedUrl}</code>
                    </div>
                  )}
                </div>

                <div className="border border-dashed border-slate-300 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors group cursor-pointer relative">
                  <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">📄</div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">Import Articles</h3>
                  <p className="text-slate-500 text-sm mb-6">Upload Markdown (.md) with frontmatter</p>
                  
                  <input 
                    type="file" 
                    accept=".md,.markdown"
                    onChange={handleMarkdownImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                   <div className="pointer-events-none inline-block bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 shadow-sm">
                    Select Markdown File
                  </div>
                </div>

                {uploadStatus && (
                  <div className={`p-4 rounded-lg text-sm font-medium text-center ${uploadStatus.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
