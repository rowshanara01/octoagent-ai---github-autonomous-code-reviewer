import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK on server side with mandatory User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// GitHub API Fetch Proxy for public & private repositories, PRs, Commits, and Files
app.get('/api/github/fetch-pr', async (req, res) => {
  try {
    const { url, repo, pullNumber } = req.query as { url?: string; repo?: string; pullNumber?: string };
    const userGithubToken = (req.headers['x-github-token'] as string) || (req.query.token as string) || '';

    const headers: Record<string, string> = {
      'User-Agent': 'OctoAgent-AI-CodeReviewer',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (userGithubToken && userGithubToken.trim().length > 0) {
      headers['Authorization'] = `Bearer ${userGithubToken.trim()}`;
    }

    let targetOwner = '';
    let targetRepo = '';
    let targetPR = '';
    let targetCommit = '';
    let targetBlobPath = '';
    let targetBranch = '';

    const inputUrl = (url || '').trim();

    if (inputUrl) {
      // Check for Pull Request: github.com/owner/repo/pull/123
      const prMatch = inputUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
      // Check for Commit: github.com/owner/repo/commit/([a-f0-9]+)
      const commitMatch = inputUrl.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/i);
      // Check for Blob/File: github.com/owner/repo/blob/([^/]+)\/(.+)
      const blobMatch = inputUrl.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i);
      // Check for bare repo: github.com/owner/repo or owner/repo
      const repoMatch = inputUrl.match(/(?:github\.com\/)?([^/\s]+)\/([^/\s#?]+)/i);

      if (prMatch) {
        targetOwner = prMatch[1];
        targetRepo = prMatch[2];
        targetPR = prMatch[3];
      } else if (commitMatch) {
        targetOwner = commitMatch[1];
        targetRepo = commitMatch[2];
        targetCommit = commitMatch[3];
      } else if (blobMatch) {
        targetOwner = blobMatch[1];
        targetRepo = blobMatch[2];
        targetBranch = blobMatch[3];
        targetBlobPath = blobMatch[4];
      } else if (repoMatch) {
        targetOwner = repoMatch[1];
        targetRepo = repoMatch[2].replace(/\.git$/i, '');
      }
    } else if (repo) {
      const parts = repo.split('/');
      if (parts.length === 2) {
        targetOwner = parts[0];
        targetRepo = parts[1];
        targetPR = pullNumber || '';
      }
    }

    if (!targetOwner || !targetRepo) {
      return res.status(400).json({ error: 'Please provide a valid GitHub URL (e.g. https://github.com/owner/repo/pull/123 or https://github.com/owner/repo)' });
    }

    // SCENARIO 1: Pull Request
    if (targetPR) {
      const prRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/pulls/${targetPR}`, { headers });
      if (!prRes.ok) {
        if (prRes.status === 404) {
          return res.status(404).json({ error: `Pull request #${targetPR} in ${targetOwner}/${targetRepo} not found (if it is private, add your GitHub Personal Access Token).` });
        }
        if (prRes.status === 403) {
          return res.status(403).json({ error: 'GitHub API rate limit exceeded (60 req/hr for anonymous). Add a free GitHub Token or try our preset PRs.' });
        }
        return res.status(prRes.status).json({ error: `GitHub API error: ${prRes.statusText}` });
      }
      const prData = await prRes.json();

      // Fetch changed files
      const filesRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/pulls/${targetPR}/files?per_page=35`, { headers });
      const filesData = filesRes.ok ? await filesRes.json() : [];

      // Filter out auto-generated files (lockfiles, sourcemaps, minified files)
      const meaningfulFiles = filesData.filter((f: any) => {
        const name = f.filename.toLowerCase();
        return !name.endsWith('.lock') && 
               !name.endsWith('-lock.json') && 
               !name.endsWith('.lockb') && 
               !name.endsWith('.map') && 
               !name.endsWith('.min.js') &&
               !name.endsWith('.min.css');
      });

      const formattedFiles = (meaningfulFiles.length > 0 ? meaningfulFiles : filesData).map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch || '',
      }));

      return res.json({
        id: `pr-${targetPR}`,
        title: prData.title,
        repo: `${targetOwner}/${targetRepo}`,
        author: prData.user?.login || 'unknown',
        branch: prData.head?.ref || 'feature',
        baseBranch: prData.base?.ref || 'main',
        description: prData.body || 'No description provided.',
        files: formattedFiles,
      });
    }

    // SCENARIO 2: Single File / Blob
    if (targetBlobPath) {
      const fileRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${targetBlobPath}?ref=${targetBranch || 'main'}`, { headers });
      if (!fileRes.ok) {
        return res.status(fileRes.status).json({ error: `Could not fetch file ${targetBlobPath} from ${targetOwner}/${targetRepo}` });
      }
      const fileData = await fileRes.json();
      const content = Buffer.from(fileData.content || '', 'base64').toString('utf8');

      return res.json({
        id: `file-${Date.now()}`,
        title: `Audit: ${targetBlobPath}`,
        repo: `${targetOwner}/${targetRepo}`,
        author: targetOwner,
        branch: targetBranch || 'main',
        baseBranch: 'main',
        description: `Full source code audit of ${targetBlobPath}`,
        files: [
          {
            filename: targetBlobPath,
            status: 'modified',
            additions: content.split('\n').length,
            deletions: 0,
            content: content.slice(0, 8000), // Protect token boundaries
          }
        ],
      });
    }

    // SCENARIO 3: Single Commit
    if (targetCommit) {
      const commitRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/commits/${targetCommit}`, { headers });
      if (!commitRes.ok) {
        return res.status(commitRes.status).json({ error: `Commit ${targetCommit} not found in ${targetOwner}/${targetRepo}` });
      }
      const commitData = await commitRes.json();
      const files = (commitData.files || []).map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch || '',
      }));

      return res.json({
        id: `commit-${targetCommit.slice(0, 7)}`,
        title: commitData.commit?.message?.split('\n')[0] || `Commit ${targetCommit.slice(0, 7)}`,
        repo: `${targetOwner}/${targetRepo}`,
        author: commitData.author?.login || commitData.commit?.author?.name || 'unknown',
        branch: 'commit',
        baseBranch: 'HEAD~1',
        description: commitData.commit?.message || '',
        files,
      });
    }

    // SCENARIO 4: Bare Repo URL -> fetch latest open PR or latest commit
    const pullsRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/pulls?state=open&per_page=1`, { headers });
    if (pullsRes.ok) {
      const pulls = await pullsRes.json();
      if (pulls && pulls.length > 0) {
        const latestPR = pulls[0];
        const filesRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/pulls/${latestPR.number}/files?per_page=30`, { headers });
        const filesData = filesRes.ok ? await filesRes.json() : [];

        return res.json({
          id: `pr-${latestPR.number}`,
          title: latestPR.title,
          repo: `${targetOwner}/${targetRepo}`,
          author: latestPR.user?.login || 'unknown',
          branch: latestPR.head?.ref || 'main',
          baseBranch: latestPR.base?.ref || 'main',
          description: latestPR.body || 'Latest open PR in repository.',
          files: filesData.map((f: any) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch || '',
          })),
        });
      }
    }

    return res.status(404).json({ error: `No open pull requests found in ${targetOwner}/${targetRepo}. You can specify a direct PR URL, commit URL, or paste your code diff.` });
  } catch (err: any) {
    console.error('GitHub fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch GitHub repository data' });
  }
});

// Post Review Directly to GitHub Pull Request (If User Provides Token)
app.post('/api/github/post-review', async (req, res) => {
  try {
    const { repo, pullNumber, verdict, body } = req.body;
    const token = req.headers['x-github-token'] as string;

    if (!token) {
      return res.status(401).json({ error: 'GitHub Personal Access Token with repo scope is required to post reviews.' });
    }

    if (!repo || !pullNumber || !body) {
      return res.status(400).json({ error: 'Missing required review fields (repo, pullNumber, body).' });
    }

    const event = verdict === 'APPROVE' ? 'APPROVE' : verdict === 'REQUEST_CHANGES' ? 'REQUEST_CHANGES' : 'COMMENT';

    const ghRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${pullNumber}/reviews`, {
      method: 'POST',
      headers: {
        'User-Agent': 'OctoAgent-AI-CodeReviewer',
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body,
        event,
      }),
    });

    if (!ghRes.ok) {
      const errData = await ghRes.json();
      return res.status(ghRes.status).json({ error: errData.message || 'Failed to post review to GitHub' });
    }

    const data = await ghRes.json();
    return res.json({ success: true, reviewUrl: data.html_url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error communicating with GitHub API' });
  }
});

// Autonomous Multi-Agent Code Review Endpoint
app.post('/api/agents/review', async (req, res) => {
  try {
    const { title, repo, author, branch, description, files, language = 'en', focusAreas = [] } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files or diffs provided for review.' });
    }

    const isBengali = language === 'bn';

    const systemInstruction = `You are "OctoAgent AI", an autonomous multi-agent code review system for GitHub repositories and pull requests.
You simulate a collaborative squad of top-tier software engineers and security researchers:
1. "Triage & AST Orchestrator" (Architect): Maps changed files, blast radius, technology stack, and assigns tasks.
2. "SecOps Specialist" (Security Auditor): Inspects OWASP Top 10, CWE violations, cryptographic weaknesses, timing attacks, SQL injection, XSS, insecure deserialization, secrets, and auth bypass.
3. "Performance & Scalability Architect": Evaluates algorithmic time/space complexity, memory leaks, unclosed cursors/streams, event loop blockers, and database N+1 problems.
4. "Clean Code & System Design Lead": Assesses modularity, SOLID principles, idiomatic language standards, DRY, race conditions, and error propagation.
5. "QA & Test Automation Specialist": Discovers edge-cases, nullability issues, missing regression tests, and boundary values.
6. "PR Review Lead (Synthesis)": Consolidates all findings, assigns precise severity (CRITICAL, HIGH, MEDIUM, LOW, NITPICK), decides final Pull Request Verdict (APPROVE, REQUEST_CHANGES, COMMENT), writes concrete before/after code fixes, and computes scores.

${isBengali ? 'IMPORTANT: The user requested the review in Bengali (বাংলা). Please write the summary, verdictSummary, findings descriptions, impact, and checklists in fluent, professional Bengali (বাংলা) while keeping code identifiers, CWE names, and programming terms natural in English/Bengali.' : 'Please write all explanations in clear, professional English.'}

CRITICAL: Return ONLY valid, well-formed JSON matching the specified JSON structure without markdown code fences or conversational text.`;

    const codeContext = files.map((f: any, idx: number) => {
      return `--- File ${idx + 1}: ${f.filename} (${f.status || 'modified'}, +${f.additions || 0}/-${f.deletions || 0}) ---
${f.patch ? f.patch : f.content || 'No diff available'}`;
    }).join('\n\n');

    const prompt = `Review this GitHub Pull Request:
Repository: ${repo || 'user-repository'}
Title: ${title || 'Code Changes'}
Author: ${author || 'contributor'}
Branch: ${branch || 'feature-branch'}
Description: ${description || 'N/A'}
Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'All (Security, Performance, Architecture, Reliability)'}

Code Diffs / Files to Review:
${codeContext}

Analyze the changes thoroughly and output a JSON object with this exact shape:
{
  "verdict": "REQUEST_CHANGES" | "APPROVE" | "COMMENT",
  "verdictSummary": "One crisp sentence explaining the verdict decision",
  "riskScore": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "scoreBreakdown": {
    "security": number (0-100),
    "performance": number (0-100),
    "architecture": number (0-100),
    "reliability": number (0-100),
    "overallScore": number (0-100)
  },
  "summary": "Detailed high-level architectural and security summary of the changes",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "checklist": [
    {"item": "Checklist item 1", "passed": boolean},
    {"item": "Checklist item 2", "passed": boolean},
    {"item": "Checklist item 3", "passed": boolean},
    {"item": "Checklist item 4", "passed": boolean}
  ],
  "agentExecutionTimeline": [
    {
      "id": "agent-orchestrator",
      "name": "Triage & AST Orchestrator",
      "role": "Stack Discovery & Impact Mapping",
      "status": "completed",
      "logs": ["Parsed file changes", "Identified sensitive auth/data flows"],
      "findingsCount": number,
      "durationMs": 320
    },
    {
      "id": "agent-secops",
      "name": "SecOps Specialist",
      "role": "Static Application Security Testing",
      "status": "completed",
      "logs": ["Checked for OWASP Top 10 vulnerabilities", "Audited cryptographic operations and input boundaries"],
      "findingsCount": number,
      "durationMs": 640
    },
    {
      "id": "agent-perf",
      "name": "Performance & Scalability Architect",
      "role": "Runtime & Resource Profiling",
      "status": "completed",
      "logs": ["Profiled async execution paths", "Inspected connection pool & memory handling"],
      "findingsCount": number,
      "durationMs": 480
    },
    {
      "id": "agent-qa",
      "name": "QA & Test Specialist",
      "role": "Test Matrix & Invariant Verification",
      "status": "completed",
      "logs": ["Identified missing unit tests and edge cases", "Checked regression vulnerabilities"],
      "findingsCount": number,
      "durationMs": 350
    }
  ],
  "findings": [
    {
      "id": "finding-1",
      "file": "exact filename from changes",
      "line": line_number,
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NITPICK",
      "category": "SECURITY" | "PERFORMANCE" | "ARCHITECTURE" | "TESTS" | "STYLE",
      "agent": "SecOps Specialist" | "Performance Architect" | "Clean Code Lead" | "QA Specialist",
      "title": "Short title describing the defect",
      "message": "Clear explanation of what the problem is and why it matters",
      "impact": "Real-world blast radius if merged to production",
      "cweOrRule": "e.g. CWE-208 / OWASP A02 / ReDoS / Memory Leak",
      "suggestion": {
        "before": "exact faulty code lines",
        "after": "exact secure/optimized replacement code lines",
        "explanation": "Why this replacement resolves the defect"
      },
      "suggestedPatch": "unified diff patch format if applicable"
    }
  ],
  "generatedTests": "Complete runnable test code (e.g. Vitest/Jest/PyTest) covering the critical edge cases and security boundaries identified."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let reviewData;
    try {
      reviewData = JSON.parse(text);
    } catch {
      // Clean possible wrapper fences
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      reviewData = JSON.parse(cleanJson);
    }

    const enrichedReport = {
      id: `report-${Date.now()}`,
      prTitle: title,
      repo: repo || 'repository',
      author: author || 'developer',
      branch: branch || 'main',
      baseBranch: 'main',
      verdict: reviewData.verdict || 'COMMENT',
      verdictSummary: reviewData.verdictSummary || 'Review completed with itemized findings.',
      riskScore: reviewData.riskScore || 'MEDIUM',
      scoreBreakdown: reviewData.scoreBreakdown || {
        security: 80,
        performance: 85,
        architecture: 80,
        reliability: 82,
        overallScore: 82,
      },
      summary: reviewData.summary || 'Code review completed.',
      keyStrengths: reviewData.keyStrengths || ['Modular code structure', 'Clear naming conventions'],
      checklist: reviewData.checklist || [],
      findings: reviewData.findings || [],
      agentExecutionTimeline: reviewData.agentExecutionTimeline || [],
      generatedTests: reviewData.generatedTests || '',
      timestamp: new Date().toISOString(),
      language,
    };

    return res.json(enrichedReport);
  } catch (err: any) {
    console.error('Agent review error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete autonomous agent code review.' });
  }
});

// Interactive Agent Remediation & Discussion Chat
app.post('/api/agents/chat', async (req, res) => {
  try {
    const { messages, codeContext, language = 'en' } = req.body;

    const isBengali = language === 'bn';

    const systemInstruction = `You are the OctoAgent AI Senior Code Review Lead.
You are assisting a software engineer with questions about a code review, security vulnerabilities, performance optimizations, or architecture refactoring.
${isBengali ? 'Respond in natural, fluent, helpful Bengali (বাংলা), keeping technical code snippets and function names in English.' : 'Respond in clear, concise, actionable English.'}
Provide concrete code examples, explanations of CWEs / runtime bugs, and guidance when requested.`;

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // If context provided, prepend to prompt
    let userPrompt = messages[messages.length - 1]?.content || 'Hello';
    if (codeContext) {
      userPrompt = `Relevant Code Review Context:\n${JSON.stringify(codeContext, null, 2)}\n\nUser Question:\n${userPrompt}`;
      formattedMessages[formattedMessages.length - 1] = {
        role: 'user',
        parts: [{ text: userPrompt }],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedMessages,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      reply: response.text || 'Unable to generate response.',
      agentName: 'OctoAgent Synthesis Lead',
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message || 'Chat service encountered an error' });
  }
});

// Dedicated Fix Generator for a Finding
app.post('/api/agents/generate-fix', async (req, res) => {
  try {
    const { finding, fileContext, language = 'en' } = req.body;
    const isBengali = language === 'bn';

    const systemInstruction = `You are the OctoAgent AI Automated Remediation Specialist.
You generate an exact, production-ready code fix for a detected security or performance defect.
${isBengali ? 'Provide explanations in Bengali (বাংলা).' : 'Provide explanations in English.'}
Return valid JSON with:
{
  "fixedCode": "Full replacement function or block of code",
  "explanation": "Brief explanation of how this fix resolves the defect",
  "gitDiff": "Git unified diff representation (- and +)",
  "securityVerification": "How this change was verified against the attack vector"
}`;

    const prompt = `Defect to fix:
Title: ${finding.title}
File: ${finding.file} (Line ${finding.line})
Severity: ${finding.severity}
CWE / Rule: ${finding.cweOrRule || 'N/A'}
Defect details: ${finding.message}
Current faulty snippet:
${finding.suggestion?.before || ''}

Context:
${fileContext || ''}

Generate the secure production-ready fix in JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Generate fix error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate fix' });
  }
});

// Mount Vite in dev or serve dist in production
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OctoAgent AI Server running on port ${PORT}`);
  });
}

startServer();
