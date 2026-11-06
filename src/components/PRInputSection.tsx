import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  Search, 
  Code, 
  Sparkles, 
  Layers, 
  AlertCircle, 
  Check, 
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  FileCode,
  Key,
  Upload,
  Lock,
  Globe,
  Info
} from 'lucide-react';
import { PRESET_PRS } from '../data/presets';
import { PresetPR, ReviewFile } from '../types';
import { translations } from '../translations';

interface PRInputSectionProps {
  language: 'en' | 'bn';
  onStartReview: (data: {
    title: string;
    repo: string;
    author: string;
    branch: string;
    description: string;
    files: ReviewFile[];
    focusAreas: string[];
  }) => void;
  isLoading: boolean;
}

export const PRInputSection: React.FC<PRInputSectionProps> = ({
  language,
  onStartReview,
  isLoading,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [activeInputTab, setActiveInputTab] = useState<'presets' | 'url' | 'raw'>('presets');
  const [prUrl, setPrUrl] = useState('');
  const [isFetchingPR, setIsFetchingPR] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // GitHub Personal Access Token (stored in localStorage)
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('octoagent_github_pat') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Selected or current PR state
  const [currentPR, setCurrentPR] = useState<PresetPR>(PRESET_PRS[0]);

  // Raw diff / uploaded files state
  const [rawTitle, setRawTitle] = useState('feat: User authentication and token handler');
  const [rawFilename, setRawFilename] = useState('src/auth/token.ts');
  const [rawDiff, setRawDiff] = useState(`@@ -10,12 +10,24 @@ export function verifyToken(token: string) {
-  return jwt.verify(token, secret);
+  // Insecure: decoding without signature verification
+  const decoded = jwt.decode(token);
+  if (decoded.role === 'admin') {
+    grantAdminAccess(decoded.userId);
+  }
+  return decoded;
+}`);

  // Focus areas
  const [focusAreas, setFocusAreas] = useState<string[]>([
    'Security & OWASP',
    'Performance & Leaks',
    'Clean Architecture',
    'QA & Invariants'
  ]);

  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('octoagent_github_pat', githubToken);
    } else {
      localStorage.removeItem('octoagent_github_pat');
    }
  }, [githubToken]);

  const toggleFocus = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleFetchGithubPR = async (overrideUrl?: string) => {
    const urlToFetch = overrideUrl || prUrl;
    if (!urlToFetch.trim()) return;
    setIsFetchingPR(true);
    setFetchError(null);

    try {
      const headers: Record<string, string> = {};
      if (githubToken.trim()) {
        headers['x-github-token'] = githubToken.trim();
      }

      const res = await fetch(`/api/github/fetch-pr?url=${encodeURIComponent(urlToFetch.trim())}`, {
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch PR from GitHub');
      }

      const fetchedPR: PresetPR = {
        id: data.id,
        title: data.title,
        repo: data.repo,
        author: data.author,
        branch: data.branch,
        description: data.description,
        tags: ['GitHub Live Fetch'],
        files: data.files,
      };

      setCurrentPR(fetchedPR);
      setPrUrl(urlToFetch);
    } catch (err: any) {
      setFetchError(err.message || 'Error communicating with GitHub API');
    } finally {
      setIsFetchingPR(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawFilename(file.name);
    setRawTitle(`Review: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawDiff(text);
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerReview = () => {
    if (activeInputTab === 'raw') {
      onStartReview({
        title: rawTitle,
        repo: 'custom-workspace/repo',
        author: 'developer',
        branch: 'patch-1',
        description: 'Code diff submitted directly for multi-agent review.',
        files: [
          {
            filename: rawFilename,
            status: 'modified',
            additions: rawDiff.split('\n').filter(l => l.startsWith('+')).length,
            deletions: rawDiff.split('\n').filter(l => l.startsWith('-')).length,
            patch: rawDiff,
          }
        ],
        focusAreas,
      });
    } else {
      onStartReview({
        title: currentPR.title,
        repo: currentPR.repo,
        author: currentPR.author,
        branch: currentPR.branch,
        description: currentPR.description,
        files: currentPR.files,
        focusAreas,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      {/* Top Bar with Tabs and GitHub PAT Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveInputTab('presets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeInputTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.tabPresetPR}</span>
          </button>

          <button
            onClick={() => setActiveInputTab('url')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeInputTab === 'url'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>{t.tabGithubPR}</span>
          </button>

          <button
            onClick={() => setActiveInputTab('raw')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeInputTab === 'raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{t.tabPasteDiff}</span>
          </button>
        </div>

        {/* GitHub PAT & Rate Limit Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              githubToken
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="GitHub Token for Private Repos & High Rate Limit"
          >
            <Key className="w-3 h-3 text-indigo-400" />
            <span>{githubToken ? (isBn ? 'গিটহাব টোকেন সক্রিয়' : 'GitHub Token Set') : (isBn ? 'গিটহাব টোকেন (ঐচ্ছিক)' : 'GitHub Token (Optional)')}</span>
          </button>

          {/* Focus Areas Pill Checks */}
          <div className="hidden lg:flex items-center gap-1.5">
            {[
              { label: 'Security', icon: Shield },
              { label: 'Performance', icon: Zap },
              { label: 'Architecture', icon: Layers },
              { label: 'QA & Invariants', icon: CheckCircle2 }
            ].map(({ label, icon: Icon }) => {
              const isChecked = focusAreas.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleFocus(label)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                  {isChecked && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GitHub Token Config Drawer if opened */}
      {showTokenInput && (
        <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isBn ? 'গিটহাব পার্সোনাল অ্যাক্সেস টোকেন (PAT)' : 'GitHub Personal Access Token (Optional)'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isBn
                  ? 'প্রাইভেট রিপোজিটরি পড়তে শুধু একবার এই টোকেনটি দিতে হয়। এটি সম্পূর্ণ নিরাপদ এবং শুধু আপনার ব্রাউজারে থাকে।'
                  : 'Required only for private repositories. Stored safely inside your local browser.'}
              </p>
            </div>

            {/* Direct 1-Click Link to GitHub Token Creation */}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=OctoAgent-Code-Reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isBn ? '👉 ১-ক্লিকে টোকেন তৈরি করুন' : '👉 1-Click Generate Token'}</span>
            </a>
          </div>

          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (এখানে টোকেন পেস্ট করুন)"
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              {githubToken && (
                <button
                  onClick={() => setGithubToken('')}
                  className="px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium hover:bg-rose-900/60 cursor-pointer"
                >
                  {isBn ? 'মুছে ফেলুন' : 'Clear'}
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                {isBn 
                  ? 'টোকেন পেস্ট করার পর নিচের "গিটহাব পিআর লিংক" ট্যাবে গিয়ে আপনার প্রাইভেট URL দিন।' 
                  : 'After pasting token, switch to "GitHub PR URL" tab below to enter your private URL.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Preset PRs */}
      {activeInputTab === 'presets' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            {t.presetNotice}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_PRS.map((pr) => {
              const isSelected = currentPR.id === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => setCurrentPR(pr)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono text-indigo-400 truncate">
                      {pr.repo}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {pr.files.length} {pr.files.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                    {pr.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {pr.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pr.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: GitHub PR / Repo URL */}
      {activeInputTab === 'url' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123 or owner/repo"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={() => handleFetchGithubPR()}
              disabled={isFetchingPR || !prUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>{isFetchingPR ? t.fetchingPR : t.fetchPRButton}</span>
            </button>
          </div>

          {/* Quick Real Repo Examples */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500">{isBn ? 'উদাহরণ দেখুন:' : 'Try sample live repos:'}</span>
            {[
              { label: 'facebook/react PR', url: 'https://github.com/facebook/react/pull/28821' },
              { label: 'expressjs/express PR', url: 'https://github.com/expressjs/express/pull/5800' },
              { label: 'torvalds/linux', url: 'https://github.com/torvalds/linux' },
            ].map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setPrUrl(sample.url);
                  handleFetchGithubPR(sample.url);
                }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 hover:text-white hover:border-indigo-500 text-[11px] font-mono cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {fetchError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">{isBn ? 'গিটহাব থেকে ফেচ করতে সমস্যা হয়েছে' : 'GitHub Fetch Error'}</div>
                <div className="mt-0.5">{fetchError}</div>
                <div className="mt-1 text-[11px] text-rose-400">
                  {isBn
                    ? 'টিপস: যদি রেপোটি প্রাইভেট হয় তবে উপরে আপনার GitHub Personal Access Token যোগ করুন, অথবা সরাসরি কোড/ডিফ ট্যাবে পেস্ট করুন।'
                    : 'Tip: For private repos or when rate-limited, provide a GitHub Personal Access Token above, or paste the git diff directly.'}
                </div>
                {!githubToken && (
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(true)}
                    className="mt-2 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>{isBn ? 'গিটহাব টোকেন (PAT) ইনপুট করুন' : 'Add GitHub Token (PAT)'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Current Loaded PR Preview */}
          {currentPR && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono text-indigo-400">{currentPR.repo}</span>
                <span className="font-mono">{currentPR.branch}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{currentPR.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{currentPR.description}</p>
              
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isBn ? 'পরিবর্তিত ফাইলসমূহ' : 'Files in this PR:'}
                </div>
                {currentPR.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono py-1 px-2.5 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-300 truncate">{file.filename}</span>
                    <span className="text-slate-500 text-[11px]">
                      <span className="text-emerald-400">+{file.additions || 0}</span> / <span className="text-rose-400">-{file.deletions || 0}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Raw Diff Paste or File Upload */}
      {activeInputTab === 'raw' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isBn ? 'পিআর টাইটেল / বর্ণনামূলক নাম' : 'PR Title / Change Summary'}
              </label>
              <input
                type="text"
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isBn ? 'ফাইল পাথ' : 'Target Filename'}
              </label>
              <input
                type="text"
                value={rawFilename}
                onChange={(e) => setRawFilename(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isBn ? 'ফাইল বা ডিফ আপলোড করুন (.diff, .patch, .ts, .py)' : 'Upload File / Diff (.diff, .patch, .ts, .py)'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".diff,.patch,.txt,.ts,.js,.py,.go,.rs,.java,.cpp,.c"
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-500">
              {isBn ? 'অথবা নিচে সরাসরি ডিফ বা কোড পেস্ট করুন' : 'or paste unified diff below'}
            </span>
          </div>

          <div>
            <textarea
              rows={7}
              value={rawDiff}
              onChange={(e) => setRawDiff(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              placeholder="Paste git diff (git diff main) or raw source code here..."
            />
          </div>
        </div>
      )}

      {/* Active Selection Details & Launch CTA */}
      <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span>
            {activeInputTab === 'raw'
              ? `Reviewing 1 custom snippet (${rawFilename})`
              : `${currentPR.files.length} changed files in ${currentPR.repo}`}
          </span>
        </div>

        <button
          onClick={handleTriggerReview}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{isLoading ? t.reviewingInProgress : t.startReviewButton}</span>
        </button>
      </div>
    </div>
  );
};
