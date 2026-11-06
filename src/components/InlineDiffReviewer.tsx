import React, { useState } from 'react';
import { 
  FileCode, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Copy, 
  Check, 
  Wrench, 
  Sparkles, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  GitMerge,
  FileCheck2,
  Code2
} from 'lucide-react';
import { ReviewFinding, ReviewFile, Severity, Category } from '../types';
import { translations } from '../translations';

interface InlineDiffReviewerProps {
  files: ReviewFile[];
  findings: ReviewFinding[];
  language: 'en' | 'bn';
  onInspectFix?: (finding: ReviewFinding) => void;
}

export const InlineDiffReviewer: React.FC<InlineDiffReviewerProps> = ({
  files,
  findings,
  language,
  onInspectFix,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'diff' | 'merged'>('diff');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMerged, setCopiedMerged] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  const currentFile = files[activeFileIndex] || files[0] || { filename: 'unknown', patch: '' };

  // Filter findings for current file and severity
  const fileFindings = findings.filter(f => {
    const matchFile = !f.file || f.file.includes(currentFile.filename) || currentFile.filename.includes(f.file);
    if (!matchFile) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          dot: 'bg-rose-500',
          label: isBn ? 'ক্রিটিকাল' : 'CRITICAL',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/80 text-orange-300 border-orange-800',
          dot: 'bg-orange-500',
          label: isBn ? 'উচ্চ ঝুঁকি' : 'HIGH',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          dot: 'bg-amber-500',
          label: isBn ? 'মাঝারি' : 'MEDIUM',
        };
      case 'LOW':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800',
          dot: 'bg-blue-500',
          label: isBn ? 'সাধারণ' : 'LOW',
        };
      case 'NITPICK':
      default:
        return {
          bg: 'bg-slate-900 text-slate-300 border-slate-700',
          dot: 'bg-slate-500',
          label: isBn ? 'ক্ষুদ্র ত্রুটি' : 'NITPICK',
        };
    }
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedFindings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute the fully merged & patched file code
  const getMergedFileResult = () => {
    let baseCode = currentFile.content || '';
    if (!baseCode && currentFile.patch) {
      const rawLines = currentFile.patch.split('\n');
      const reconstructed: string[] = [];
      for (const line of rawLines) {
        if (line.startsWith('@@')) continue;
        if (line.startsWith('-')) continue; // PR deletion lines
        if (line.startsWith('+')) {
          reconstructed.push(line.substring(1));
        } else if (line.startsWith(' ')) {
          reconstructed.push(line.substring(1));
        } else {
          reconstructed.push(line);
        }
      }
      baseCode = reconstructed.join('\n');
    }

    if (!baseCode) return { code: '// No code found in diff', appliedCount: 0 };

    let patchedCode = baseCode;
    let count = 0;

    for (const f of fileFindings) {
      if (f.suggestion && f.suggestion.before && f.suggestion.after) {
        const target = f.suggestion.before.trim();
        const replacement = f.suggestion.after.trim();
        if (patchedCode.includes(target)) {
          patchedCode = patchedCode.replace(target, replacement);
          count++;
        } else {
          // Line-by-line fallback
          const firstLine = target.split('\n')[0]?.trim();
          if (firstLine && patchedCode.includes(firstLine)) {
            patchedCode = patchedCode.replace(firstLine, replacement);
            count++;
          }
        }
      }
    }

    return { code: patchedCode, appliedCount: count };
  };

  const mergedResult = getMergedFileResult();

  const handleCopyMergedCode = () => {
    navigator.clipboard.writeText(mergedResult.code);
    setCopiedMerged(true);
    setTimeout(() => setCopiedMerged(false), 2000);
  };

  const handleDownloadMergedFile = () => {
    const filename = currentFile.filename.split('/').pop() || 'patched-code.txt';
    const blob = new Blob([mergedResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPatch = () => {
    const patchContent = fileFindings
      .filter(f => f.suggestedPatch || f.suggestion)
      .map(f => f.suggestedPatch || `--- a/${f.file}\n+++ b/${f.file}\n@@ -${f.line} +${f.line} @@\n- ${f.suggestion?.before}\n+ ${f.suggestion?.after}`)
      .join('\n\n');

    const blob = new Blob([patchContent], { type: 'text/x-diff;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `octoagent-patch-${currentFile.filename.replace(/\//g, '-')}.patch`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse patch lines with line numbers for diff view
  const parsePatchLines = (patchString: string) => {
    if (!patchString) return [];

    const rawLines = patchString.split('\n');
    let oldLine = 0;
    let newLine = 0;

    return rawLines.map((line, idx) => {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
        }
        return {
          id: idx,
          type: 'header',
          content: line,
          oldNum: null,
          newNum: null,
        };
      }

      if (line.startsWith('+')) {
        const currentNew = newLine++;
        return {
          id: idx,
          type: 'addition',
          content: line.substring(1),
          oldNum: null,
          newNum: currentNew,
        };
      }

      if (line.startsWith('-')) {
        const currentOld = oldLine++;
        return {
          id: idx,
          type: 'deletion',
          content: line.substring(1),
          oldNum: currentOld,
          newNum: null,
        };
      }

      const currentOld = oldLine++;
      const currentNew = newLine++;
      return {
        id: idx,
        type: 'context',
        content: line.startsWith(' ') ? line.substring(1) : line,
        oldNum: currentOld,
        newNum: currentNew,
      };
    });
  };

  const parsedLines = parsePatchLines(currentFile.patch || currentFile.content || '');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Changed Files Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {files.map((file, idx) => {
            const isActive = idx === activeFileIndex;
            const fileFindingCount = findings.filter(f => f.file?.includes(file.filename) || file.filename.includes(f.file || '')).length;
            return (
              <button
                key={file.filename}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[200px]">{file.filename}</span>
                {fileFindingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {fileFindingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: [ Diff & Inline Review ] VS [ Full Merged Code ] */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('diff')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'diff'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{isBn ? 'গিট ডিফ ও ইনলাইন রিভিউ' : 'Diff & Review'}</span>
            </button>

            <button
              onClick={() => setViewMode('merged')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'merged'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBn ? 'সংশোধিত মার্জ করা ফাইল' : 'Auto-Merged Code'}</span>
            </button>
          </div>

          {/* Severity Filter Controls (active in diff view) */}
          {viewMode === 'diff' && (
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {['ALL', 'CRITICAL', 'HIGH'].map((sev) => {
                const count = sev === 'ALL' 
                  ? fileFindings.length 
                  : fileFindings.filter(f => f.severity === sev).length;
                const isActive = severityFilter === sev;

                return (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{sev}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Auto-Merged & Patched Source Code View */}
      {viewMode === 'merged' ? (
        <div className="p-4 space-y-4">
          {/* Merged Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  {isBn 
                    ? `সংশোধিত মার্জড কোড: ${mergedResult.appliedCount}টি ত্রুটি সঠিক স্থানে প্রতিস্থাপন করা হয়েছে!` 
                    : `Patched Code: All ${mergedResult.appliedCount} vulnerabilities auto-merged in place!`}
                </div>
                <div className="text-[11px] text-emerald-300">
                  {isBn
                    ? 'আপনার ফাইলের সঠিক লাইনে সিকিউর প্যাচ বসিয়ে কোড প্রস্তুত করা হয়েছে। ১-ক্লিকে কপি বা ডাউনলোড করুন।'
                    : 'Faulty lines were seamlessly replaced with the secure/optimized routines. Ready to copy or download.'}
                </div>
              </div>
            </div>

            {/* Actions: Copy, Download, Git Patch */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyMergedCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedMerged ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMerged ? (isBn ? 'কপি সম্পন্ন!' : 'Copied!') : (isBn ? 'সম্পূর্ণ কোড কপি' : 'Copy Fixed Code')}</span>
              </button>

              <button
                onClick={handleDownloadMergedFile}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Fixed File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? 'ফাইল ডাউনলোড' : 'Download File'}</span>
              </button>

              <button
                onClick={handleDownloadPatch}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Git Patch (.patch)"
              >
                <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isBn ? 'গিট প্যাচ (.patch)' : '.patch File'}</span>
              </button>
            </div>
          </div>

          {/* Full Code Container with Line Numbers */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
            <table className="w-full border-collapse">
              <tbody>
                {mergedResult.code.split('\n').map((line, i) => (
                  <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                    <td className="w-12 px-2 py-0.5 text-right text-slate-600 select-none border-r border-slate-800/80 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-0.5 whitespace-pre leading-relaxed text-slate-200">
                      {line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: Unified Diff & Line-by-Line Review */
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {parsedLines.map((line) => {
                const lineFindings = fileFindings.filter(f => 
                  (line.newNum !== null && f.line === line.newNum) ||
                  (line.oldNum !== null && f.line === line.oldNum)
                );

                return (
                  <React.Fragment key={line.id}>
                    <tr
                      className={`border-b border-slate-950 transition-colors ${
                        line.type === 'addition'
                          ? 'bg-emerald-950/20 text-emerald-200'
                          : line.type === 'deletion'
                          ? 'bg-rose-950/25 text-rose-300 line-through'
                          : line.type === 'header'
                          ? 'bg-slate-950/80 text-indigo-400 font-semibold'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="w-12 px-2 py-0.5 text-right text-slate-600 select-none border-r border-slate-800/60 tabular-nums">
                        {line.oldNum !== null ? line.oldNum : ''}
                      </td>

                      <td className="w-12 px-2 py-0.5 text-right text-slate-600 select-none border-r border-slate-800/60 tabular-nums">
                        {line.newNum !== null ? line.newNum : ''}
                      </td>

                      <td className="w-6 px-1.5 py-0.5 text-center select-none font-bold">
                        {line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ''}
                      </td>

                      <td className="px-3 py-0.5 whitespace-pre font-mono leading-relaxed overflow-x-visible">
                        {line.content}
                      </td>
                    </tr>

                    {/* Inline Review Comment Card */}
                    {lineFindings.map((finding) => {
                      const badge = getSeverityBadge(finding.severity);
                      const isExpanded = expandedFindings[finding.id] !== false;

                      return (
                        <tr key={`comment-${finding.id}`} className="bg-slate-950 border-y-2 border-indigo-500/40">
                          <td colSpan={4} className="p-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl">
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${badge.bg}`}>
                                    {badge.label}
                                  </span>

                                  <span className="text-xs font-semibold text-slate-300">
                                    {finding.agent}
                                  </span>

                                  {finding.cweOrRule && (
                                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-400">
                                      {finding.cweOrRule}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {onInspectFix && (
                                    <button
                                      onClick={() => onInspectFix(finding)}
                                      className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Wrench className="w-3 h-3" />
                                      <span>{t.applyFix}</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toggleExpand(finding.id)}
                                    className="p-1 rounded text-slate-400 hover:text-white"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <h4 className="text-sm font-bold text-white mb-1.5">
                                {finding.title}
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                {finding.message}
                              </p>

                              {finding.impact && (
                                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs mb-3 flex items-start gap-2">
                                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">{t.impact}: </span>
                                    <span>{finding.impact}</span>
                                  </div>
                                </div>
                              )}

                              {finding.suggestion && isExpanded && (
                                <div className="mt-3 space-y-2">
                                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {t.suggestedFix}
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40">
                                      <div className="text-[10px] text-rose-400 font-semibold mb-1">
                                        {t.originalCode}
                                      </div>
                                      <pre className="text-xs font-mono text-rose-200 overflow-x-auto whitespace-pre">
                                        {finding.suggestion.before}
                                      </pre>
                                    </div>

                                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 relative group">
                                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold mb-1">
                                        <span>{t.recommendedPatch}</span>
                                        <button
                                          onClick={() => handleCopyCode(finding.id, finding.suggestion?.after || '')}
                                          className="text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                        >
                                          {copiedId === finding.id ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                          <span>{copiedId === finding.id ? 'Copied' : 'Copy'}</span>
                                        </button>
                                      </div>
                                      <pre className="text-xs font-mono text-emerald-200 overflow-x-auto whitespace-pre">
                                        {finding.suggestion.after}
                                      </pre>
                                    </div>
                                  </div>

                                  {finding.suggestion.explanation && (
                                    <div className="text-xs text-slate-400 italic pt-1">
                                      💡 {finding.suggestion.explanation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
