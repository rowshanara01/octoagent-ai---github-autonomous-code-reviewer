import React, { useState } from 'react';
import { X, Copy, Check, TestTube, FileCode } from 'lucide-react';

interface GeneratedTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testsCode: string;
  repo: string;
  language: 'en' | 'bn';
}

export const GeneratedTestsModal: React.FC<GeneratedTestsModalProps> = ({
  isOpen,
  onClose,
  testsCode,
  repo,
  language,
}) => {
  const isBn = language === 'bn';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(testsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400">
              <TestTube className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isBn ? 'স্বয়ংক্রিয়ভাবে জেনারেট করা ইউনিট টেস্ট স্যুট' : 'Automated QA Unit Test Suite'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {repo} · Automated Invariant Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/90 font-mono text-xs">
          <pre className="text-slate-200 whitespace-pre leading-relaxed overflow-x-auto">
            {testsCode || '// No specific test suite generated.'}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>
              {isBn ? 'এই টেস্টগুলো CI/CD পাইপলাইনে যোগ করা যাবে' : 'Ready to commit into test runner'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'টেস্ট কোড কপি করুন' : 'Copy Test Code')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
