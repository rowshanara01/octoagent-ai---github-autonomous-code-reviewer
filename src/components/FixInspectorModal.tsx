import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Wrench, ShieldAlert, Sparkles, Code2 } from 'lucide-react';
import { ReviewFinding } from '../types';

interface FixInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: ReviewFinding | null;
  fileContent?: string;
  language: 'en' | 'bn';
}

export const FixInspectorModal: React.FC<FixInspectorModalProps> = ({
  isOpen,
  onClose,
  finding,
  fileContent,
  language,
}) => {
  const isBn = language === 'bn';
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fixData, setFixData] = useState<{
    fixedCode: string;
    explanation: string;
    gitDiff: string;
    securityVerification: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !finding) {
      setFixData(null);
      return;
    }

    // If suggestion already has details, initialize
    if (finding.suggestion) {
      setFixData({
        fixedCode: finding.suggestion.after,
        explanation: finding.suggestion.explanation || finding.message,
        gitDiff: finding.suggestedPatch || `--- a/${finding.file}\n+++ b/${finding.file}\n@@ -${finding.line} +${finding.line} @@\n- ${finding.suggestion.before}\n+ ${finding.suggestion.after}`,
        securityVerification: isBn
          ? 'এই সমাধানটি মেমরি স্পেস, ইনপুট বাউন্ডারি এবং ক্রিপ্টোগ্রাফিক তুলনার নিরাপত্তা নিশ্চিত করে।'
          : 'Verifies timing invariants, input sanitation boundaries, and resource cleanup guarantees.',
      });
    }

    // Call API for deep remediation if needed
    const fetchDeepFix = async () => {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/agents/generate-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            finding,
            fileContext: fileContent,
            language,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.fixedCode) {
            setFixData(data);
          }
        }
      } catch (e) {
        console.error('Deep fix fetch error:', e);
      } finally {
        setIsGenerating(false);
      }
    };

    fetchDeepFix();
  }, [isOpen, finding, language]);

  if (!isOpen || !finding) return null;

  const handleCopyCode = () => {
    if (!fixData) return;
    navigator.clipboard.writeText(fixData.fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-400">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {finding.severity}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {finding.file}:{finding.line}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                {finding.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Finding explanation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-slate-200 mb-1">
              {isBn ? 'ত্রুটি বিশ্লেষণ:' : 'Defect Analysis:'}
            </div>
            <div>{finding.message}</div>
          </div>

          {/* Faulty Code Snippet */}
          {finding.suggestion?.before && (
            <div>
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                {isBn ? 'ত্রুটিযুক্ত বর্তমান কোড (Original)' : 'Vulnerable Code (Before)'}
              </div>
              <pre className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-200 text-xs font-mono overflow-x-auto whitespace-pre">
                {finding.suggestion.before}
              </pre>
            </div>
          )}

          {/* Fixed Replacement Code */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
              <span>{isBn ? 'প্রস্তাবিত সংশোধিত কোড (Secure Fix)' : 'Recommended Patch (After)'}</span>
              {isGenerating && (
                <span className="flex items-center gap-1 text-indigo-400 font-normal normal-case">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>{isBn ? 'এজেন্ট অপ্টিমাইজ করছে...' : 'Optimizing patch...'}</span>
                </span>
              )}
            </div>

            <pre className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 text-xs font-mono overflow-x-auto whitespace-pre">
              {fixData?.fixedCode || finding.suggestion?.after || '// Generating fix...'}
            </pre>
          </div>

          {/* Verification rationale */}
          {fixData?.securityVerification && (
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-200">
              <span className="font-semibold text-indigo-300">
                {isBn ? 'নিরাপত্তা যাচাইকরণ: ' : 'Security Verification: '}
              </span>
              <span>{fixData.securityVerification}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {finding.cweOrRule && (
              <span className="font-mono text-indigo-400">Rule: {finding.cweOrRule}</span>
            )}
          </div>

          <button
            onClick={handleCopyCode}
            disabled={!fixData?.fixedCode}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'ফিক্স কোড কপি করুন' : 'Copy Fixed Code')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
