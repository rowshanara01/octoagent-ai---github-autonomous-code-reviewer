/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PRInputSection } from './components/PRInputSection';
import { AgentSwarmTimeline } from './components/AgentSwarmTimeline';
import { ReviewSummaryHeader } from './components/ReviewSummaryHeader';
import { InlineDiffReviewer } from './components/InlineDiffReviewer';
import { AgentSwarmView } from './components/AgentSwarmView';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { GeneratedTestsModal } from './components/GeneratedTestsModal';
import { FixInspectorModal } from './components/FixInspectorModal';
import { InteractiveVideoTutorial } from './components/InteractiveVideoTutorial';
import { PRESET_PRS } from './data/presets';
import { ReviewReport, ReviewFile, ReviewFinding } from './types';
import { translations } from './translations';
import { 
  GitPullRequest, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertOctagon,
  ArrowRight,
  FolderGit2,
  PlayCircle,
  Video
} from 'lucide-react';

// Seed initial report for immediate instant interactivity
const INITIAL_DEMO_REPORT: ReviewReport = {
  id: 'report-demo-142',
  prTitle: PRESET_PRS[0].title,
  repo: PRESET_PRS[0].repo,
  author: PRESET_PRS[0].author,
  branch: PRESET_PRS[0].branch,
  baseBranch: 'main',
  verdict: 'REQUEST_CHANGES',
  verdictSummary: 'Critical security timing attack in token rotation comparison and plaintext token storage must be remediated before merge.',
  riskScore: 'CRITICAL',
  scoreBreakdown: {
    security: 42,
    performance: 78,
    architecture: 84,
    reliability: 65,
    overallScore: 67,
  },
  summary: 'This pull request implements refresh token rotation for OAuth 2.1 sessions. While the architectural intent is sound, the implementation introduces high-severity vulnerabilities: raw string comparison enables timing side-channel attacks, incoming tokens are decoded without verifying signatures, and raw refresh tokens are persisted in plaintext cache without hashing.',
  keyStrengths: [
    'Adopts RFC 6749 OAuth 2.1 token rotation pattern to mitigate token replay attacks.',
    'Includes automatic session revocation cascade when token reuse is detected.',
    'Separates access and refresh token lifetimes cleanly.'
  ],
  checklist: [
    { item: 'Zero timing-attack vectors in cryptographic token validation', passed: false },
    { item: 'Refresh tokens hashed (SHA-256) prior to Redis cache storage', passed: false },
    { item: 'All asynchronous telemetry and audit promises handled', passed: false },
    { item: 'Strict TypeScript typing and error serialization', passed: true }
  ],
  findings: [
    {
      id: 'f-1',
      file: 'src/services/auth.service.ts',
      line: 48,
      severity: 'CRITICAL',
      category: 'SECURITY',
      agent: 'SecOps Specialist',
      title: 'Timing Side-Channel Attack in Token Comparison (CWE-208)',
      message: 'Direct string comparison (!==) terminates on the first mismatched byte, allowing an attacker to determine the valid refresh token byte-by-byte via statistical timing measurement.',
      impact: 'Enables unauthorized session takeover and forge valid refresh tokens in under 5,000 requests.',
      cweOrRule: 'CWE-208 / OWASP A02:2021 Cryptographic Failures',
      suggestion: {
        before: 'if (!storedToken || storedToken !== incomingToken) {',
        after: `// Constant-time buffer comparison to prevent timing attacks
const storedBuf = Buffer.from(storedToken || '', 'utf8');
const incomingBuf = Buffer.from(incomingToken || '', 'utf8');
if (storedBuf.length !== incomingBuf.length || !crypto.timingSafeEqual(storedBuf, incomingBuf)) {`,
        explanation: 'crypto.timingSafeEqual executes in constant time regardless of where byte mismatches occur, preventing timing leakage.'
      }
    },
    {
      id: 'f-2',
      file: 'src/services/auth.service.ts',
      line: 55,
      severity: 'HIGH',
      category: 'SECURITY',
      agent: 'SecOps Specialist',
      title: 'Token Payload Decoded Without Expiry Verification (CWE-287)',
      message: 'jwt.decode() only inspects Base64 payload data without verifying the cryptographic signature or checking the exp timestamp claim.',
      impact: 'Allows expired or tampered tokens with manipulated claims to trigger session refreshes.',
      cweOrRule: 'CWE-287: Improper Authentication',
      suggestion: {
        before: 'const payload = jwt.decode(incomingToken) as any;',
        after: `// Cryptographically verify token signature and expiry before reading claims
const payload = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;`,
        explanation: 'jwt.verify enforces HMAC/RSA signature validation and automatically rejects expired tokens.'
      }
    },
    {
      id: 'f-3',
      file: 'src/services/auth.service.ts',
      line: 62,
      severity: 'HIGH',
      category: 'SECURITY',
      agent: 'SecOps Specialist',
      title: 'Plaintext Refresh Token Storage in Cache (CWE-312)',
      message: 'Refresh tokens are stored raw in Redis. If the cache layer is compromised or dumped, all active user refresh tokens are immediately exposed.',
      impact: 'Full compromise of long-lived user credentials in event of Redis memory leak or unauthorized read access.',
      cweOrRule: 'CWE-312: Cleartext Storage of Sensitive Information',
      suggestion: {
        before: "await this.redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 7 * 86400);",
        after: `// Store SHA-256 hash of refresh token instead of plaintext
const tokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
await this.redis.set(\`refresh:\${userId}\`, tokenHash, 'EX', 7 * 86400);`,
        explanation: 'Storing a one-way cryptographic hash ensures stolen cache dumps cannot be used to forge bearer sessions.'
      }
    },
    {
      id: 'f-4',
      file: 'src/services/auth.service.ts',
      line: 65,
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      agent: 'Performance Architect',
      title: 'Unhandled Asynchronous Promise in Audit Hook',
      message: 'this.auditService.logSecurityEvent is invoked without await or .catch(), risking unhandled rejection termination in modern Node.js runtimes.',
      impact: 'Node process crash or silent dropping of critical compliance security audit events under high throughput.',
      cweOrRule: 'Node.js UnhandledPromiseRejection',
      suggestion: {
        before: `this.auditService.logSecurityEvent({
  event: 'TOKEN_ROTATED',
  userId,
  timestamp: new Date().toISOString()
});`,
        after: `// Gracefully capture background telemetry without blocking the critical path
this.auditService.logSecurityEvent({
  event: 'TOKEN_ROTATED',
  userId,
  timestamp: new Date().toISOString()
}).catch((err) => {
  logger.warn('Failed to dispatch background security telemetry', { err, userId });
});`,
        explanation: 'Attaching an explicit .catch prevents unhandled rejection crashes while maintaining non-blocking performance.'
      }
    },
    {
      id: 'f-5',
      file: 'src/controllers/auth.controller.ts',
      line: 23,
      severity: 'MEDIUM',
      category: 'ARCHITECTURE',
      agent: 'Clean Code Lead',
      title: 'Sensitive Refresh Token Returned in Body Instead of HttpOnly Cookie',
      message: 'Returning refresh tokens directly inside the JSON response exposes them to malicious client-side JavaScript (XSS attacks).',
      impact: 'Any cross-site scripting flaw in the web client allows adversaries to steal the long-lived refresh token.',
      cweOrRule: 'OWASP Security Best Practice',
      suggestion: {
        before: 'return res.json({ success: true, ...tokens });',
        after: `// Set HttpOnly, Secure, SameSite cookie for refresh token
res.cookie('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 86400 * 1000,
});
return res.json({ success: true, accessToken: tokens.accessToken });`,
        explanation: 'HttpOnly cookies cannot be accessed via JavaScript document.cookie, neutralizing XSS exfiltration.'
      }
    }
  ],
  agentExecutionTimeline: [
    {
      id: 'agent-orchestrator',
      name: 'Triage & AST Orchestrator',
      role: 'Stack Discovery & Impact Mapping',
      avatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      status: 'completed',
      logs: ['Parsed TypeScript AST for auth service & controller', 'Identified cryptographic operations & session token churn'],
      findingsCount: 0,
      durationMs: 310
    },
    {
      id: 'agent-secops',
      name: 'SecOps Specialist',
      role: 'Static Application Security Testing',
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      status: 'completed',
      logs: ['Detected constant-time comparison violation (CWE-208)', 'Flagged cleartext token caching in Redis (CWE-312)'],
      findingsCount: 3,
      durationMs: 680
    },
    {
      id: 'agent-perf',
      name: 'Performance & Scalability Architect',
      role: 'Runtime & Resource Profiling',
      avatar: '/src/assets/images/avatar_perf_agent_1793336942536.jpg',
      status: 'completed',
      logs: ['Profiled unhandled async audit telemetry promise', 'Checked token hashing CPU cost (<0.2ms overhead)'],
      findingsCount: 1,
      durationMs: 460
    },
    {
      id: 'agent-qa',
      name: 'QA & Test Specialist',
      role: 'Test Matrix & Invariant Verification',
      avatar: '/src/assets/images/avatar_secops_agent_1793336942383.jpg',
      status: 'completed',
      logs: ['Identified missing test vectors for token replay', 'Synthesized 4 automated regression test cases'],
      findingsCount: 1,
      durationMs: 380
    }
  ],
  generatedTests: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import crypto from 'crypto';

describe('AuthService - Token Rotation & Security Bounds', () => {
  let authService: AuthService;
  let mockRedis: any;
  let mockAudit: any;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    mockAudit = {
      logSecurityEvent: vi.fn().mockResolvedValue(true),
    };
    authService = new AuthService(mockRedis, mockAudit);
  });

  it('should reject mismatched refresh tokens using timing-safe comparison', async () => {
    const validToken = 'a'.repeat(64);
    const attackToken = 'a'.repeat(63) + 'b';
    mockRedis.get.mockResolvedValue(validToken);

    await expect(
      authService.rotateRefreshToken('user-123', attackToken)
    ).rejects.toThrow(/mismatch/i);
  });

  it('should persist SHA-256 hashed refresh token in cache instead of plaintext', async () => {
    const validToken = 'valid-token-string';
    mockRedis.get.mockResolvedValue(validToken);

    const result = await authService.rotateRefreshToken('user-123', validToken);
    expect(result.refreshToken).toBeDefined();

    // Verify Redis received hash
    const expectedHash = crypto.createHash('sha256').update(result.refreshToken).digest('hex');
    expect(mockRedis.set).toHaveBeenCalledWith(
      'refresh:user-123',
      expectedHash,
      'EX',
      expect.any(Number)
    );
  });

  it('should catch unhandled rejection in background audit telemetry', async () => {
    mockAudit.logSecurityEvent.mockRejectedValue(new Error('Telemetry timeout'));
    mockRedis.get.mockResolvedValue('valid-token');

    // Should complete successfully without throwing unhandled promise error
    await expect(authService.rotateRefreshToken('user-123', 'valid-token')).resolves.toBeDefined();
  });
});`,
  timestamp: new Date().toISOString(),
  language: 'en'
};

export default function App() {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState<string>('reviewer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ReviewReport | null>(INITIAL_DEMO_REPORT);
  const [currentFiles, setCurrentFiles] = useState<ReviewFile[]>(PRESET_PRS[0].files);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [inspectingFinding, setInspectingFinding] = useState<ReviewFinding | null>(null);

  const t = translations[language];
  const isBn = language === 'bn';

  const handleStartReview = async (reviewInput: {
    title: string;
    repo: string;
    author: string;
    branch: string;
    description: string;
    files: ReviewFile[];
    focusAreas: string[];
  }) => {
    setIsLoading(true);
    setCurrentFiles(reviewInput.files);

    try {
      const res = await fetch('/api/agents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewInput,
          language,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete review');
      }

      const newReport: ReviewReport = await res.json();
      setReport(newReport);
      setActiveTab('reviewer');
    } catch (err: any) {
      console.error('Review execution error:', err);
      // Fallback update to existing report with error notes
      alert(err.message || 'Error occurred while contacting OctoAgent review swarm.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar with 3-zone contract */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveReport={!!report}
        onOpenVideo={() => setIsVideoOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {activeTab === 'reviewer' && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isBn ? 'স্বায়ত্তশাসিত এআই কোড রিভিউ সিস্টেম' : 'Autonomous Multi-Agent SAST & Architecture Engine'}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                  {t.heroTitle}
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </div>

              {/* Video Tutorial CTA Card */}
              <div className="shrink-0">
                <button
                  onClick={() => setIsVideoOpen(true)}
                  className="w-full sm:w-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition-all flex items-center gap-3.5 group cursor-pointer shadow-lg hover:shadow-indigo-500/20"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors shrink-0">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                      <span>{isBn ? '🎥 ভিডিও গাইড দেখুন' : '🎥 Watch Video Guide'}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-300">2:55</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isBn ? 'পাবলিক ও প্রাইভেট রেপো ব্যবহারের সম্পূর্ণ স্ক্রিনকাস্ট' : 'How to review Public & Private Repos'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View: Reviewer (Main Workflow) */}
        {activeTab === 'reviewer' && (
          <div>
            {/* PR Input & Configuration */}
            <PRInputSection
              language={language}
              onStartReview={handleStartReview}
              isLoading={isLoading}
            />

            {/* Live Multi-Agent Swarm Pipeline Timeline */}
            <AgentSwarmTimeline
              timeline={report?.agentExecutionTimeline || []}
              isLoading={isLoading}
              language={language}
            />

            {/* Review Summary Header (Scores, Verdict, Strengths, Checklist) */}
            {report && (
              <ReviewSummaryHeader
                report={report}
                language={language}
                onOpenChat={() => setIsChatOpen(true)}
                onOpenTests={() => setIsTestsOpen(true)}
              />
            )}

            {/* Inline Diff & Line-by-Line Review Comments */}
            {report && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {t.findingsTitle}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    <span className="text-indigo-400 font-bold">{report.findings.length}</span> {isBn ? 'টি পর্যবেক্ষণ' : 'findings across changes'}
                  </div>
                </div>

                <InlineDiffReviewer
                  files={currentFiles}
                  findings={report.findings}
                  language={language}
                  onInspectFix={(finding) => setInspectingFinding(finding)}
                />
              </div>
            )}
          </div>
        )}

        {/* View: Findings (Focused View) */}
        {activeTab === 'findings' && report && (
          <div>
            <ReviewSummaryHeader
              report={report}
              language={language}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenTests={() => setIsTestsOpen(true)}
            />

            <InlineDiffReviewer
              files={currentFiles}
              findings={report.findings}
              language={language}
              onInspectFix={(finding) => setInspectingFinding(finding)}
            />
          </div>
        )}

        {/* View: Agent Swarm Architecture */}
        {activeTab === 'swarm' && (
          <AgentSwarmView
            language={language}
            onSelectReview={() => setActiveTab('reviewer')}
          />
        )}

        {/* View: Presets Gallery */}
        {activeTab === 'presets' && (
          <div className="py-6 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                {isBn ? 'বাস্তব কোড রিভিউ সিনারিও প্রিসেট' : 'Curated Pull Request Vulnerability Scenarios'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {isBn
                  ? 'গিটহাবের বাস্তব কোডবেসে পাওয়া অত্যন্ত সাধারণ কিন্তু মারাত্মক ক্রিপ্টোগ্রাফিক, কনকারেন্সি এবং পারফরম্যান্স ত্রুটি পরীক্ষা করুন।'
                  : 'Test the autonomous agent swarm against real-world production defects: timing attacks, raw SQL injection, goroutine leaks, and ReDoS.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_PRS.map((pr) => (
                <div
                  key={pr.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-indigo-400 mb-2">
                      <span>{pr.repo}</span>
                      <span className="text-slate-500 font-sans">{pr.files.length} files</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">
                      {pr.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {pr.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pr.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleStartReview({
                        title: pr.title,
                        repo: pr.repo,
                        author: pr.author,
                        branch: pr.branch,
                        description: pr.description,
                        files: pr.files,
                        focusAreas: ['Security & OWASP', 'Performance & Leaks', 'Clean Architecture', 'QA & Invariants'],
                      });
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{isBn ? 'এই পিআরটি রিভিউ করুন' : 'Run Multi-Agent Review on this PR'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Remediation Assistant */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsChatOpen(true)}
          className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-2xl shadow-indigo-600/50 border border-indigo-400/40 flex items-center gap-2.5 transition-all cursor-pointer group hover:scale-105"
        >
          <img
            src="/src/assets/images/avatar_lead_agent_1793336942287.jpg"
            alt="Agent Lead"
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-md object-cover border border-indigo-300/40"
          />
          <span>{isBn ? 'এজেন্ট লিড চ্যাট' : 'Ask Agent Lead'}</span>
        </button>
      </div>

      {/* Slide-over Remediation Chat Drawer */}
      <AgentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        report={report}
        language={language}
      />

      {/* Generated Automated Unit Tests Modal */}
      <GeneratedTestsModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
        testsCode={report?.generatedTests || ''}
        repo={report?.repo || 'codebase'}
        language={language}
      />

      {/* Deep Fix Inspector Modal */}
      <FixInspectorModal
        isOpen={!!inspectingFinding}
        onClose={() => setInspectingFinding(null)}
        finding={inspectingFinding}
        language={language}
      />

      {/* Interactive Video Screencast Tutorial Modal */}
      <InteractiveVideoTutorial
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        language={language}
        onTryPublic={() => {
          setActiveTab('reviewer');
        }}
        onTryPrivate={() => {
          setActiveTab('reviewer');
        }}
        onTryLocal={() => {
          setActiveTab('reviewer');
        }}
      />
    </div>
  );
}
