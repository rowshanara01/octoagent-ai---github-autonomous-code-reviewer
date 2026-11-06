import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, Cpu, Check, Activity } from 'lucide-react';
import { AgentStep } from '../types';

interface AgentSwarmTimelineProps {
  timeline: AgentStep[];
  isLoading: boolean;
  language: 'en' | 'bn';
}

export const AgentSwarmTimeline: React.FC<AgentSwarmTimelineProps> = ({
  timeline,
  isLoading,
  language,
}) => {
  const isBn = language === 'bn';

  const defaultAgents: AgentStep[] = [
    {
      id: 'agent-orchestrator',
      name: isBn ? 'ট্রায়াজ ও এএসটি অর্কেস্ট্রেটর' : 'Triage & AST Orchestrator',
      role: isBn ? 'সোর্স কোড ডিপেন্ডেন্সি ম্যাপিং' : 'File Tree & Stack Discovery',
      avatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      status: isLoading ? 'running' : 'completed',
      logs: [
        isBn ? 'পরিবর্তিত ফাইল ট্রি পার্স করা হয়েছে' : 'AST parsed for changed files',
        isBn ? 'অথেনটিকেশন ও স্টোরেজ ডিপেন্ডেন্সি চিহ্নিত' : 'Identified auth & sensitive state flows',
      ],
      findingsCount: 0,
      durationMs: 340,
    },
    {
      id: 'agent-secops',
      name: isBn ? 'সেকঅপস ও ভালনারেবিলিটি স্পেশালিস্ট' : 'SecOps Specialist',
      role: isBn ? 'স্ট্যাটিক সিকিউরিটি অডিট (SAST)' : 'Static Security & OWASP Audit',
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      status: isLoading ? 'running' : 'completed',
      logs: [
        isBn ? 'টাইমিং অ্যাটাক এবং ক্রিপ্টো তুলনা নিরীক্ষা' : 'Audited timing attack & crypto comparison vectors',
        isBn ? 'ইনজেকশন ও টোকেন স্টোরেজ স্ক্যান' : 'Scanned injection & plaintext secret exposure',
      ],
      findingsCount: 3,
      durationMs: 720,
    },
    {
      id: 'agent-perf',
      name: isBn ? 'পারফরম্যান্স ও স্কেলেবিলিটি আর্কিটেক্ট' : 'Performance Architect',
      role: isBn ? 'রানটাইম ও রিসোর্স প্রোফাইলিং' : 'Algorithmic & Memory Profiling',
      avatar: '/src/assets/images/avatar_perf_agent_1793336942536.jpg',
      status: isLoading ? 'running' : 'completed',
      logs: [
        isBn ? 'কানেকশন রিলিজ এবং মেমোরি লিক পরীক্ষা' : 'Checked unreleased pool connections & leaks',
        isBn ? 'অ্যাসিঙ্ক প্রমিস হ্যান্ডলিং ও ব্লক পর্যবেক্ষণ' : 'Evaluated unhandled async promises & event loop blocks',
      ],
      findingsCount: 2,
      durationMs: 510,
    },
    {
      id: 'agent-qa',
      name: isBn ? 'কিউএ ও ইনভ্যারিয়েন্ট স্পেশালিস্ট' : 'QA & Invariant Specialist',
      role: isBn ? 'টেস্ট ম্যাট্রিক্স ও এজ-কেস ভেরিফিকেশন' : 'Test Coverage & Edge Cases',
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      status: isLoading ? 'pending' : 'completed',
      logs: [
        isBn ? 'মিসিং টেস্ট কেস ও নাল হ্যান্ডলিং চিহ্নিত' : 'Mapped boundary condition & null safety gaps',
        isBn ? 'রিগ্রেশন টেস্ট কেস জেনারেট করা হয়েছে' : 'Synthesized automated regression tests',
      ],
      findingsCount: 1,
      durationMs: 410,
    },
  ];

  const stepsToDisplay = timeline && timeline.length > 0 ? timeline : defaultAgents;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {isBn ? 'স্বায়ত্তশাসিত এজেন্ট পাইপলাইন টাইমলাইন' : 'Autonomous Agent Pipeline Execution'}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono tabular-nums">4 Agents Active</span>
          <span>·</span>
          <span className="text-indigo-400 font-mono">Gemini 3.8 Flash</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stepsToDisplay.map((step, idx) => {
          const isCurrentRunning = isLoading && idx === 1;

          return (
            <div
              key={step.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isCurrentRunning
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={step.avatar || '/src/assets/images/avatar_lead_agent_1793336942287.jpg'}
                    alt={step.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-md object-cover border border-slate-700 bg-slate-800"
                  />
                  <div>
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                      {step.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {step.role}
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Logs */}
              <div className="bg-slate-900/90 rounded-lg p-2 my-2 border border-slate-800/60 space-y-1">
                {step.logs && step.logs.slice(0, 2).map((log, lIdx) => (
                  <div key={lIdx} className="text-[11px] font-mono text-slate-300 truncate">
                    <span className="text-indigo-400 mr-1.5 font-bold">›</span>
                    {log}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/40">
                <span>{step.findingsCount || 0} {isBn ? 'চিহ্নিত' : 'flagged'}</span>
                <span className="tabular-nums">{(step.durationMs || 300) / 1000}s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
