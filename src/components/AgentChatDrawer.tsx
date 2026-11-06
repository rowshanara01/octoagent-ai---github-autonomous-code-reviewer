import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  HelpCircle,
  Code2
} from 'lucide-react';
import { ChatMessage, ReviewReport } from '../types';
import { translations } from '../translations';

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReviewReport | null;
  language: 'en' | 'bn';
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  report,
  language,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      agentName: 'OctoAgent Synthesis Lead',
      agentAvatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
      content: isBn
        ? 'স্বাগতম! আমি আপনার কোড রিভিউ টিম লিড। এই পুল রিকোয়েস্টের সিকিউরিটি ত্রুটি, সমাধান, অথবা ইউনিট টেস্ট তৈরি সম্পর্কে যে কোনো প্রশ্ন করতে পারেন।'
        : 'Welcome! I am your OctoAgent Review Lead. Ask me anything about the detected vulnerabilities, request custom unit tests, or ask for step-by-step refactoring guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = isBn
    ? [
        'এই কোডের প্রধান সিকিউরিটি সমস্যাগুলো বাংলায় বুঝিয়ে বলুন',
        'রিফ্রেশ টোকেন রোটেশনের জন্য সুরক্ষিত কোড লিখুন',
        'Vitest ইউনিট টেস্ট তৈরি করে দিন',
        'কীভাবে টাইমিং অ্যাটাক প্রতিরোধ করা যায়?',
      ]
    : [
        'Explain how the timing attack in AuthService works',
        'Generate full unit tests using Vitest',
        'How can I fix the unhandled async promise rejection?',
        'Rewrite this function using Clean Architecture',
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const codeContext = report
        ? {
            repo: report.repo,
            prTitle: report.prTitle,
            verdict: report.verdict,
            findingsCount: report.findings.length,
            findings: report.findings.map((f) => ({
              title: f.title,
              severity: f.severity,
              file: f.file,
              line: f.line,
              cwe: f.cweOrRule,
              defect: f.message,
            })),
          }
        : null;

      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          codeContext,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        agentName: data.agentName || 'OctoAgent Synthesis Lead',
        agentAvatar: '/src/assets/images/avatar_lead_agent_1793336942287.jpg',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        content: `Error: ${err.message || 'Unable to connect to agent service'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/avatar_lead_agent_1793336942287.jpg"
              alt="OctoAgent Lead"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover border border-slate-700 bg-slate-800"
            />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t.chatDrawerTitle}
              </h3>
              <p className="text-xs text-indigo-400 font-medium">
                Gemini 3.8 Flash · Multi-Agent Context
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

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isUser && (
                  <img
                    src={msg.agentAvatar || '/src/assets/images/avatar_lead_agent_1793336942287.jpg'}
                    alt="Agent"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-md object-cover border border-slate-700 bg-slate-800 shrink-0 mt-1"
                  />
                )}

                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? (isBn ? 'আপনি' : 'You') : msg.agentName}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}

                    {!isUser && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.content)}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono py-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{isBn ? 'এজেন্ট উত্তর তৈরি করছে...' : 'Agent synthesizing response...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            <span>{isBn ? 'দ্রুত প্রশ্ন' : 'Suggested Inquiries'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-colors cursor-pointer text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chatPlaceholder}
              disabled={isSending}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
