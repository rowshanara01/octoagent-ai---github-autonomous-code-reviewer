import { GitPullRequest, Globe, ShieldCheck, PlayCircle } from 'lucide-react';
import { translations } from '../translations';

interface NavbarProps {
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasActiveReport: boolean;
  onOpenVideo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  hasActiveReport,
  onOpenVideo,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GitPullRequest className="w-5 h-5 text-indigo-400" />
          </div>
          <button 
            onClick={() => setActiveTab('reviewer')}
            className="text-left cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap block">
              {t.brandName}
            </span>
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('reviewer')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'reviewer'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navReviewer}
          </button>

          {hasActiveReport && (
            <button
              onClick={() => setActiveTab('findings')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'findings'
                  ? 'text-white border-b-2 border-indigo-500 font-semibold'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              {language === 'bn' ? 'রিভিউ ফলাফল' : 'Live Findings'}
            </button>
          )}

          <button
            onClick={() => setActiveTab('swarm')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'swarm'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navAgentSwarm}
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'presets'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            {t.navPresets}
          </button>

          <button
            onClick={onOpenVideo}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.navVideo}</span>
          </button>
        </nav>

        {/* Zone 3: Language switch & actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === 'bn'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autonomous Engine v3.8</span>
          </div>
        </div>
      </div>
    </header>
  );
};
