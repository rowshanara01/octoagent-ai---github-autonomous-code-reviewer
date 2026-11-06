import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  MessageSquare, 
  TestTube,
  ShieldCheck,
  Zap,
  Layers,
  GitBranch
} from 'lucide-react';
import { ReviewReport } from '../types';
import { translations } from '../translations';

interface ReviewSummaryHeaderProps {
  report: ReviewReport;
  language: 'en' | 'bn';
  onOpenChat: () => void;
  onOpenTests: () => void;
}

export const ReviewSummaryHeader: React.FC<ReviewSummaryHeaderProps> = ({
  report,
  language,
  onOpenChat,
  onOpenTests,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';
  const [copied, setCopied] = useState(false);

  // Verdict visual styling
  const verdictConfig = {
    APPROVE: {
      label: t.verdictApprove,
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
      borderClass: 'border-emerald-500/30',
      indicatorClass: 'bg-emerald-500',
    },
    REQUEST_CHANGES: {
      label: t.verdictRequestChanges,
      icon: XCircle,
      badgeClass: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
      borderClass: 'border-rose-500/30',
      indicatorClass: 'bg-rose-500',
    },
    COMMENT: {
      label: t.verdictComment,
      icon: AlertTriangle,
      badgeClass: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
      borderClass: 'border-amber-500/30',
      indicatorClass: 'bg-amber-500',
    },
  }[report.verdict] || {
    label: t.verdictComment,
    icon: AlertTriangle,
    badgeClass: 'bg-slate-900 border-slate-700 text-slate-300',
    borderClass: 'border-slate-800',
    indicatorClass: 'bg-slate-500',
  };

  const VerdictIcon = verdictConfig.icon;

  const generateMarkdownReport = () => {
    let md = `## 🤖 OctoAgent AI Autonomous Code Review Report\n\n`;
    md += `**Repository:** \`${report.repo}\` | **Branch:** \`${report.branch}\`\n`;
    md += `**Pull Request Verdict:** **${report.verdict}** (${report.verdictSummary})\n`;
    md += `**Overall Code Health Score:** ${report.scoreBreakdown.overallScore}/100\n\n`;
    
    md += `### 📊 Health Score Breakdown\n`;
    md += `- **Security:** ${report.scoreBreakdown.security} / 100\n`;
    md += `- **Performance:** ${report.scoreBreakdown.performance} / 100\n`;
    md += `- **Architecture:** ${report.scoreBreakdown.architecture} / 100\n`;
    md += `- **Reliability:** ${report.scoreBreakdown.reliability} / 100\n\n`;

    md += `### 📝 Executive Summary\n${report.summary}\n\n`;

    if (report.keyStrengths && report.keyStrengths.length > 0) {
      md += `### ✨ Key Strengths\n`;
      report.keyStrengths.forEach((s) => {
        md += `- ${s}\n`;
      });
      md += `\n`;
    }

    md += `### 🔍 Itemized Review Findings (${report.findings.length})\n\n`;
    report.findings.forEach((f, idx) => {
      md += `#### ${idx + 1}. [${f.severity}] ${f.title} (${f.file}:${f.line})\n`;
      md += `- **Category:** \`${f.category}\` | **Agent:** ${f.agent}\n`;
      if (f.cweOrRule) md += `- **Rule / CWE:** \`${f.cweOrRule}\`\n`;
      md += `- **Defect:** ${f.message}\n`;
      md += `- **Impact:** ${f.impact}\n\n`;

      if (f.suggestion) {
        md += `\`\`\`suggestion\n${f.suggestion.after}\n\`\`\`\n\n`;
      }
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `octoagent-review-${report.repo.replace('/', '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-slate-900 border ${verdictConfig.borderClass} rounded-2xl p-6 shadow-xl mb-8`}>
      {/* Top row: Verdict & Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300 font-medium">{report.repo}</span>
            <span>/</span>
            <span>{report.branch}</span>
            <span>·</span>
            <span>{report.author}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {report.prTitle}
          </h2>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold tracking-tight shadow-sm ${verdictConfig.badgeClass}`}>
            <VerdictIcon className="w-5 h-5 shrink-0" />
            <span>{verdictConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Verdict explanation banner */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
        <span className="font-semibold text-white shrink-0">
          {isBn ? 'পর্যবেক্ষণ রায়:' : 'Verdict Rationale:'}
        </span>
        <span>{report.verdictSummary}</span>
      </div>

      {/* Scoreboard: High density tabular stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-6">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <div className="text-[11px] font-medium text-slate-400 mb-1">
            {t.overallHealth}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {report.scoreBreakdown.overallScore}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-rose-400" />
            <span>{t.securityScore}</span>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${report.scoreBreakdown.security < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {report.scoreBreakdown.security}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{t.perfScore}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {report.scoreBreakdown.performance}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>{t.archScore}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {report.scoreBreakdown.architecture}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>{t.reliabScore}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {report.scoreBreakdown.reliability}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Executive Summary & Key Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              {t.summaryTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              {report.summary}
            </p>
          </div>

          {report.keyStrengths && report.keyStrengths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                {t.strengthsTitle}
              </h3>
              <div className="space-y-1.5">
                {report.keyStrengths.map((str, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pre-Merge Checklist */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t.checklistTitle}
            </h3>
            <div className="space-y-2">
              {report.checklist && report.checklist.length > 0 ? (
                report.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {item.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className={item.passed ? 'text-slate-300' : 'text-rose-300 font-medium'}>
                      {item.item}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">
                  {isBn ? 'চেকলিস্ট সম্পন্ন হয়েছে' : 'Review checklist complete.'}
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={handleCopyMarkdown}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copiedPrMarkdown : t.copyPrMarkdown}</span>
            </button>

            {/* Direct Post to GitHub PR button if repo has pull number */}
            {report.repo.includes('/') && (
              <button
                onClick={async () => {
                  const token = localStorage.getItem('octoagent_github_pat');
                  if (!token) {
                    alert(isBn ? 'গিটহাবে সরাসরি পোস্ট করতে আপনার GitHub Personal Access Token প্রয়োজন। উপরের "গিটহাব টোকেন" বাটনে আপনার টোকেন সেট করুন।' : 'A GitHub Personal Access Token is required to post directly. Add your token in the "GitHub Token" option above.');
                    return;
                  }
                  
                  // Extract pull number if exists
                  const match = report.id.match(/pr-(\d+)/i) || report.branch.match(/(\d+)/);
                  const prNum = match ? match[1] : prompt(isBn ? 'পুল রিকোয়েস্ট নম্বর লিখুন (যেমন: 123):' : 'Enter Pull Request Number (e.g. 123):');
                  if (!prNum) return;

                  try {
                    const res = await fetch('/api/github/post-review', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-github-token': token,
                      },
                      body: JSON.stringify({
                        repo: report.repo,
                        pullNumber: prNum,
                        verdict: report.verdict,
                        body: generateMarkdownReport(),
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to post to GitHub');
                    alert(isBn ? `সফলভাবে গিটহাব পিআর #${prNum}-এ রিভিউ পোস্ট হয়েছে!` : `Successfully posted review to GitHub PR #${prNum}! URL: ${data.reviewUrl}`);
                  } catch (e: any) {
                    alert(`Error posting to GitHub: ${e.message}`);
                  }
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>{isBn ? '🚀 গিটহাবে সরাসরি পোস্ট করুন' : '🚀 Post Review Directly to GitHub PR'}</span>
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDownloadReport}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Download Markdown"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>

              <button
                onClick={onOpenTests}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="View Tests"
              >
                <TestTube className="w-3 h-3 text-cyan-400" />
                <span>Tests</span>
              </button>

              <button
                onClick={onOpenChat}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Remediation Chat"
              >
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                <span>Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
