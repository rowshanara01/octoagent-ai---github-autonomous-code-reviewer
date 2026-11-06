export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NITPICK';

export type Category = 'SECURITY' | 'PERFORMANCE' | 'ARCHITECTURE' | 'TESTS' | 'STYLE';

export type PullRequestVerdict = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

export interface ReviewFinding {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  severity: Severity;
  category: Category;
  agent: string;
  agentAvatar?: string;
  title: string;
  message: string;
  impact: string;
  cweOrRule?: string;
  suggestion?: {
    before: string;
    after: string;
    explanation: string;
  };
  suggestedPatch?: string;
}

export interface AgentStep {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
  findingsCount: number;
  durationMs?: number;
}

export interface ScoreBreakdown {
  security: number;
  performance: number;
  architecture: number;
  reliability: number;
  overallScore: number;
}

export interface ReviewReport {
  id: string;
  prTitle: string;
  repo: string;
  author: string;
  branch: string;
  baseBranch: string;
  verdict: PullRequestVerdict;
  verdictSummary: string;
  riskScore: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoreBreakdown: ScoreBreakdown;
  summary: string;
  keyStrengths: string[];
  checklist: { item: string; passed: boolean }[];
  findings: ReviewFinding[];
  agentExecutionTimeline: AgentStep[];
  generatedTests?: string;
  timestamp: string;
  language: 'en' | 'bn';
}

export interface ReviewFile {
  filename: string;
  status?: 'modified' | 'added' | 'deleted';
  additions?: number;
  deletions?: number;
  patch?: string;
  content?: string;
}

export interface PresetPR {
  id: string;
  title: string;
  repo: string;
  author: string;
  branch: string;
  description: string;
  tags: string[];
  files: ReviewFile[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  agentAvatar?: string;
  content: string;
  timestamp: string;
  codeSnippet?: string;
}
