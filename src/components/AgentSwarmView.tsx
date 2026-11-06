import React from 'react';
import { Shield, Zap, Layers, CheckCircle2, GitMerge, FileSearch } from 'lucide-react';

interface AgentSwarmViewProps {
  language: 'en' | 'bn';
  onSelectReview: () => void;
}

export const AgentSwarmView: React.FC<AgentSwarmViewProps> = ({ language, onSelectReview }) => {
  const isBn = language === 'bn';

  const agents = [
    {
      id: 'agent-orchestrator',
      name: isBn ? 'ট্রায়াজ ও এএসটি অর্কেস্ট্রেটর' : 'Triage & AST Orchestrator',
      role: isBn ? 'সোর্স কোড ও ডিফ ম্যাপিং লিড' : 'Stack Discovery & Blast Radius Mapping',
      icon: FileSearch,
      avatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      badge: 'Architecture',
      description: isBn
        ? 'পুল রিকোয়েস্টের পরিবর্তিত ফাইলসমূহ স্ক্যান করে, টেক স্ট্যাক শনাক্ত করে এবং বিশেষায়িত সাব-এজেন্টদের কাছে দায়িত্ব বণ্টন করে।'
        : 'Analyzes modified files, inspects dependency churn, parses AST structures, and dynamically plans specialized agent audits.',
      tasks: [
        isBn ? 'ফাইল ট্রি ও নির্ভরতা বিশ্লেষণ' : 'File tree & dependency graph inspection',
        isBn ? 'পরিবর্তনের প্রভাব নির্ধারণ' : 'Blast radius & churn calculation',
        isBn ? 'এজেন্টদের জন্য কর্মপরিকল্পনা তৈরি' : 'Sub-agent task delegation plan',
      ],
    },
    {
      id: 'agent-secops',
      name: isBn ? 'সেকঅপস ও ভালনারেবিলিটি স্পেশালিস্ট' : 'SecOps & Vulnerability Specialist',
      role: isBn ? 'সিকিউরিটি অডিট ও OWASP স্ক্যানার' : 'Static Application Security Testing (SAST)',
      icon: Shield,
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      badge: 'Security',
      description: isBn
        ? 'OWASP Top 10, ক্রিপ্টোগ্রাফিক ত্রুটি, টাইমিং অ্যাটাক, ইনজেকশন ভেক্টর এবং অনুমোদনের দুর্বলতা গভীরভাগে পরীক্ষা করে।'
        : 'Scans for OWASP Top 10, CWE violations, secret leakage, SQL injection, XSS, ReDoS, and timing side-channel attacks.',
      tasks: [
        isBn ? 'টাইমিং অ্যাটাক ও ক্রিপ্টো অডিট' : 'Timing attack & crypto routine audit',
        isBn ? 'ইনপুট স্যানিটাইজেশন ও XSS/SQLi পরীক্ষা' : 'Input boundary & sanitization audit',
        isBn ? 'গোপন তথ্য ও ক্রেডেনশিয়াল লিক সনাক্তকরণ' : 'Hardcoded secrets & key leakage check',
      ],
    },
    {
      id: 'agent-perf',
      name: isBn ? 'পারফরম্যান্স ও স্কেলেবিলিটি আর্কিটেক্ট' : 'Performance & Scalability Architect',
      role: isBn ? 'রানটাইম ও রিসোর্স প্রোফাইলার' : 'Algorithmic & Memory Profiling',
      icon: Zap,
      avatar: '/src/assets/images/avatar_perf_agent_1793336942536.jpg',
      badge: 'Performance',
      description: isBn
        ? 'অ্যালগরিদমিক জটিলতা (O(N)), মেমোরি লিক, আনক্লোজড কানেকশন পুল এবং ইভেন্ট লুপ ব্লকিং সমস্যা সনাক্ত করে।'
        : 'Profiles algorithmic time/space complexity, discovers unclosed streams/sessions, unindexed queries, and deadlock risks.',
      tasks: [
        isBn ? 'টাইম/স্পেস জটিলতা ও মেমোরি লিক' : 'O(N) complexity & memory retention leaks',
        isBn ? 'কানেকশন পুল ও রিসোর্স ড্রেন' : 'Database connection pool & resource leaks',
        isBn ? 'কনকারেন্সি ও ডেডলক প্রতিরোধ' : 'Concurrency lock contention & goroutine leaks',
      ],
    },
    {
      id: 'agent-architect',
      name: isBn ? 'ক্লিন কোড ও সিস্টেম ডিজাইন লিড' : 'Clean Code & System Design Lead',
      role: isBn ? 'সফটওয়্যার ডিজাইন ও প্যাটার্ন রিভিউ' : 'Modularity & Refactoring Engineer',
      icon: Layers,
      avatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      badge: 'Clean Code',
      description: isBn
        ? 'SOLID প্রিন্সিপাল, DRY নিয়ম, টাইপ সেফটি এবং মডুলার কোড কাঠামোর মান নিশ্চিত করে।'
        : 'Enforces SOLID architecture, DRY principles, strict TypeScript/Python typing, and clean error propagation contracts.',
      tasks: [
        isBn ? 'মডুলারিটি ও রিউজাবিলিটি যাচাই' : 'Coupling, cohesion & abstraction audit',
        isBn ? 'টাইপ সেফটি ও হ্যান্ডলিং' : 'Type invariance & error boundary contract',
        isBn ? 'ইডিওম্যাটিক কোডিং কনভেনশন' : 'Idiomatic style & readability standards',
      ],
    },
    {
      id: 'agent-qa',
      name: isBn ? 'কিউএ ও ইনভ্যারিয়েন্ট ভেরিফায়ার' : 'QA & Invariant Verifier',
      role: isBn ? 'টেস্ট কভারেজ ও এজ-কেস স্পেশালিস্ট' : 'Automated Test Matrix Generator',
      icon: CheckCircle2,
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      badge: 'Testing',
      description: isBn
        ? 'বাউন্ডারি ভ্যালু, নাল রেফারেন্স এবং রিক্রিয়েশন টেস্ট কেস সনাক্ত করে স্বয়ংক্রিয় টেস্ট স্যুট তৈরি করে।'
        : 'Identifies missing edge cases, null pointer risks, regression vulnerabilities, and writes unit tests in Jest/Vitest/PyTest.',
      tasks: [
        isBn ? 'বাউন্ডারি ও নাল রেফারেন্স পরীক্ষা' : 'Boundary conditions & nullability safety',
        isBn ? 'রিগ্রেশন টেস্ট ফাঁক চিহ্নিতকরণ' : 'Regression vulnerability discovery',
        isBn ? 'স্বয়ংক্রিয় ইউনিট টেস্ট কোড উৎপাদন' : 'Production unit test suite synthesis',
      ],
    },
    {
      id: 'agent-synthesizer',
      name: isBn ? 'পিআর রিভিউ সিন্থেসিস লিড' : 'PR Review Synthesis Lead',
      role: isBn ? 'চূড়ান্ত রায় ও প্যাচ জেনারেটর' : 'Pull Request Review Consensus Lead',
      icon: GitMerge,
      avatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      badge: 'Synthesis',
      description: isBn
        ? 'সকল এজেন্টের পর্যবেক্ষণ একত্র করে গিটহাব রিভিউ রেডি মার্কডাউন, রেটিং ও ইনলাইন প্যাচ তৈরি করে।'
        : 'Consolidates all specialized agent outputs, eliminates duplicates, renders inline diff suggestions, and issues the PR verdict.',
      tasks: [
        isBn ? 'পুল রিকোয়েস্ট চূড়ান্ত রায় (Approve/Reject)' : 'Formal Pull Request Verdict formulation',
        isBn ? 'ইনলাইন কোড পরিবর্তন প্রস্তাবনা' : 'One-click GitHub suggestion patches',
        isBn ? 'এক্সিকিউটিভ সামারি ও চেকলিস্ট' : 'Actionable developer remediation checklist',
      ],
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
          {isBn ? 'স্বায়ত্তশাসিত মাল্টি-এজেন্ট টিম আর্কিটেকচার' : 'Autonomous Multi-Agent Review Swarm'}
        </h2>
        <p className="text-sm text-slate-400">
          {isBn
            ? 'প্রতিটি পুল রিকোয়েস্ট ৬টি স্বতন্ত্র এআই বিশেষজ্ঞ এজেন্টের সমন্বিত দল দ্বারা নিরীক্ষিত হয়।'
            : 'Every GitHub Pull Request is scrutinized by 6 specialized autonomous agents collaborating in sequence to ensure zero-defect code.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700/80 bg-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                    <div className="text-xs text-indigo-400 font-medium">{agent.role}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {agent.description}
                </p>

                <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {isBn ? 'মূল দায়িত্ব' : 'Core Capabilities'}
                  </div>
                  {agent.tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 font-bold">›</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Model: Gemini 3.8 Flash</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={onSelectReview}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
        >
          {isBn ? 'একটি পুল রিকোয়েস্ট রিভিউ করুন' : 'Review a Pull Request Now'}
        </button>
      </div>
    </div>
  );
};
