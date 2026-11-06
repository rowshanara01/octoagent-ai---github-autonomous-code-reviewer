import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  Key, 
  GitPullRequest, 
  Lock, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  Send,
  ExternalLink,
  Shield,
  MousePointer2,
  Check,
  ChevronRight,
  ChevronLeft,
  Settings,
  User,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InteractiveVideoTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'bn';
  onTryPublic: () => void;
  onTryPrivate: () => void;
  onTryLocal: () => void;
}

interface VideoStep {
  id: number;
  titleEn: string;
  titleBn: string;
  durationSec: number;
  narrationEn: string;
  narrationBn: string;
  cursorTarget: { x: number; y: number; labelEn: string; labelBn: string };
}

const VIDEO_STEPS: VideoStep[] = [
  {
    id: 1,
    titleEn: 'Step 1: GitHub Settings → Developer Settings',
    titleBn: 'ধাপ ১: GitHub প্রোফাইল → Settings → Developer settings',
    durationSec: 14,
    narrationEn: 'First, log into GitHub. Click your profile picture at the top right, select Settings, and scroll down to Developer settings.',
    narrationBn: 'প্রথম ধাপ: GitHub-এ লগইন করে ওপরে ডানপাশে প্রোফাইল ছবিতে ক্লিক করুন। Settings-এ যান এবং নিচে Developer settings-এ ক্লিক করুন।',
    cursorTarget: { x: 82, y: 22, labelEn: 'Click Settings', labelBn: 'Settings ক্লিক করুন' },
  },
  {
    id: 2,
    titleEn: 'Step 2: Generate Token (classic) with repo scope',
    titleBn: 'ধাপ ২: Tokens (classic)-এ গিয়ে repo বক্সে টিক দিয়ে টোকেন তৈরি',
    durationSec: 15,
    narrationEn: 'Click Personal access tokens, Tokens classic, and Generate new token. Write a note, check the repo box, and click Generate token.',
    narrationBn: 'Personal access tokens-এ গিয়ে Tokens classic সিলেক্ট করুন। repo বক্সে টিক (✔) দিয়ে নিচে সবুজ বাটন Generate token চাপুন।',
    cursorTarget: { x: 50, y: 72, labelEn: 'Check [✔] repo & Generate', labelBn: 'repo টিক দিয়ে Generate চাপুন' },
  },
  {
    id: 3,
    titleEn: 'Step 3: Click "GitHub Token" button in OctoAgent',
    titleBn: 'ধাপ ৩: OctoAgent অ্যাপে "গিটহাব টোকেন (ঐচ্ছিক)" বাটনে ক্লিক ও পেস্ট',
    durationSec: 15,
    narrationEn: 'In OctoAgent, click the GitHub Token button at the top right of the input card, and paste your copied token.',
    narrationBn: 'এবার OctoAgent অ্যাপে এসে ওপরের ডানপাশে থাকা "গিটহাব টোকেন (ঐচ্ছিক)" বাটনে ক্লিক করুন এবং টোকেনটি পেস্ট করুন।',
    cursorTarget: { x: 78, y: 35, labelEn: 'Click GitHub Token', labelBn: '"গিটহাব টোকেন" বাটনে ক্লিক' },
  },
  {
    id: 4,
    titleEn: 'Step 4: Click "GitHub PR URL" tab & paste private URL',
    titleBn: 'ধাপ ৪: "GitHub PR URL" ট্যাবে প্রাইভেট লিংক পেস্ট ও Fetch PR',
    durationSec: 15,
    narrationEn: 'Click the GitHub PR URL tab. Paste your private repo pull request URL and click Fetch PR. All private files load immediately.',
    narrationBn: 'এবার "GitHub PR URL" ট্যাবে আপনার প্রাইভেট রেপোর লিংক দিন এবং Fetch PR চাপুন। টোকেনের কারণে ফাইলগুলো সাথে সাথে লোড হবে।',
    cursorTarget: { x: 82, y: 62, labelEn: 'Click Fetch PR', labelBn: 'Fetch PR বাটনে ক্লিক' },
  },
  {
    id: 5,
    titleEn: 'Step 5: Launch Agent Review & Post to GitHub',
    titleBn: 'ধাপ ৫: Launch Agent Review এবং এক ক্লিকে গিটহাবে পোস্ট',
    durationSec: 16,
    narrationEn: 'Click Launch Agent Swarm Review. When audit finishes, click Post Review Directly to GitHub to publish comments to your PR!',
    narrationBn: 'এজেন্ট সোয়ার্ম রিভিউ শুরু করুন। অডিট শেষে "Post Review to GitHub" বাটনে চাপলে সরাসরি আপনার গিটহাবে কমেন্ট চলে যাবে।',
    cursorTarget: { x: 50, y: 80, labelEn: 'Click Launch Review', labelBn: 'রিভিউ শুরু করুন' },
  },
];

export const InteractiveVideoTutorial: React.FC<InteractiveVideoTutorialProps> = ({
  isOpen,
  onClose,
  language,
  onTryPublic,
  onTryPrivate,
  onTryLocal,
}) => {
  const isBn = language === 'bn';

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepProgress, setStepProgress] = useState(0); // 0 to 100%
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Animation simulation state
  const [typedText, setTypedText] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);

  const currentStep = VIDEO_STEPS[activeStepIndex];

  // Speech narration helper using Web Speech API
  const speakNarration = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackSpeed;
      utterance.lang = isBn ? 'bn-BD' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Step change effect
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setStepProgress(0);
    setTypedText('');
    setIsClicked(false);
    setIsSuccessState(false);

    if (isPlaying) {
      const textToSpeak = isBn ? currentStep.narrationBn : currentStep.narrationEn;
      speakNarration(textToSpeak);
    }
  }, [activeStepIndex, isOpen, language]);

  // Main tick loop
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }

    const intervalMs = 100 / playbackSpeed;
    const increment = 100 / ((currentStep.durationSec * 1000) / intervalMs);

    const timer = setInterval(() => {
      setStepProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          // Advance to next step
          setActiveStepIndex((prevIdx) => (prevIdx + 1) % VIDEO_STEPS.length);
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, activeStepIndex, playbackSpeed]);

  // Micro-step visual simulation based on stepProgress
  useEffect(() => {
    if (!isPlaying) return;

    // Simulate clicking moment around 45% - 60% of step
    if (stepProgress > 45 && stepProgress < 60) {
      setIsClicked(true);
    } else {
      setIsClicked(false);
    }

    // Simulate success feedback after 60%
    if (stepProgress >= 60) {
      setIsSuccessState(true);
    }

    // Step 2 & 4: simulate typing text
    if (currentStep.id === 2 && stepProgress > 15) {
      const text = 'OctoAgent-Code-Reviewer';
      const chars = Math.floor(((stepProgress - 15) / 35) * text.length);
      setTypedText(text.slice(0, Math.min(chars, text.length)));
    } else if (currentStep.id === 4 && stepProgress > 15) {
      const url = 'https://github.com/my-username/private-api/pull/1';
      const chars = Math.floor(((stepProgress - 15) / 35) * url.length);
      setTypedText(url.slice(0, Math.min(chars, url.length)));
    }
  }, [stepProgress, currentStep.id, isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {isBn 
                ? 'ভিডিও টিউটোরিয়াল: গিটহাবে টোকেন তৈরি ও প্রাইভেট রেপো রিভিউ করার পদ্ধতি' 
                : 'Video Screencast: Creating Token on GitHub & Auditing Private Repos'}
            </h3>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
              Step {currentStep.id} of 5
            </span>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs Bar */}
        <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {VIDEO_STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{isBn ? step.titleBn.split(':')[0] : step.titleEn.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Video Canvas Stage */}
        <div className="flex-1 min-h-[350px] max-h-[470px] bg-slate-950 p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Virtual Simulated Mouse Cursor gliding across screen */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-700 ease-out flex items-center gap-1"
            style={{
              left: `${currentStep.cursorTarget.x}%`,
              top: `${currentStep.cursorTarget.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`p-1.5 rounded-full transition-all ${isClicked ? 'bg-indigo-500/50 scale-125' : 'bg-transparent'}`}>
              <MousePointer2 className="w-6 h-6 text-indigo-400 fill-indigo-400 drop-shadow-md" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-500 text-[10px] font-bold text-white shadow-lg whitespace-nowrap">
              {isBn ? currentStep.cursorTarget.labelBn : currentStep.cursorTarget.labelEn}
            </span>
          </div>

          {/* Top Status */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-semibold">
                {isBn ? currentStep.titleBn : currentStep.titleEn}
              </span>
            </div>
            <div className="text-[11px] text-indigo-400 font-mono">
              Live Animated Demo
            </div>
          </div>

          {/* Central Animated Browser & App Mockups */}
          <div className="flex-1 flex flex-col justify-center items-center my-auto w-full">
            {/* STEP 1: GitHub Settings -> Developer settings */}
            {currentStep.id === 1 && (
              <div className="w-full max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">github.com</span>
                    <span className="text-slate-500">/</span>
                    <span>settings/profile</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Profile Menu</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="col-span-1 p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Sidebar Menu</div>
                    <div className="text-slate-400">Public profile</div>
                    <div className="text-slate-400">Account</div>
                    <div className="text-slate-400">Emails</div>
                    <div className="p-1 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold">
                      👉 Developer settings
                    </div>
                  </div>

                  <div className="col-span-2 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">GitHub Developer Settings</div>
                    <p className="text-[11px] text-slate-400">
                      {isBn 
                        ? 'এখানে Personal access tokens থেকে Tokens (classic) অপশনে যেতে হবে।' 
                        : 'Select Personal access tokens → Tokens (classic) to generate your token.'}
                    </p>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[11px]">
                      Tokens (classic) → Generate new token
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Creating Token & checking repo box */}
            {currentStep.id === 2 && (
              <div className="w-full max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>New personal access token (classic)</span>
                  <span className="text-emerald-400 text-[11px] font-mono">github.com/settings/tokens/new</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400">Note:</label>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-white text-xs">
                      {typedText || 'OctoAgent'}
                      <span className="animate-pulse text-indigo-400">|</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/50 space-y-1">
                    <div className="text-[11px] text-slate-300 font-bold">Select scopes:</div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>[✔] repo (Full control of private repositories)</span>
                    </div>
                  </div>

                  {isSuccessState ? (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between font-mono text-xs text-emerald-300">
                      <span>ghp_liveToken7x89q2w3e4r5t6y7u8i9...</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                        ✓ Copied!
                      </span>
                    </div>
                  ) : (
                    <button className="w-full py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                      Generate token
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: OctoAgent - Clicking GitHub Token & Pasting */}
            {currentStep.id === 3 && (
              <div className="w-full max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white">OctoAgent AI - Home Workspace</span>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${isClicked ? 'bg-indigo-600 text-white' : 'bg-slate-950 border-indigo-500/50 text-indigo-300'}`}>
                    <Key className="w-3.5 h-3.5 inline mr-1" />
                    <span>গিটহাব টোকেন (ঐচ্ছিক)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isBn ? 'গিটহাব পার্সোনাল অ্যাক্সেস টোকেন (PAT) ইনপুট করুন:' : 'Paste your GitHub Token:'}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-emerald-400 flex items-center justify-between">
                    <span>ghp_liveToken7x89q2w3e4r5t6y7u8i9...</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {isBn ? 'ব্রাউজারে সংরক্ষিত' : 'Saved'}
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isBn ? 'টোকেন সক্রিয়! এবার প্রাইভেট রেপো ফেচ করা যাবে।' : 'Token Active! Private repos are now unlocked.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Clicking GitHub PR URL tab & Fetch PR */}
            {currentStep.id === 4 && (
              <div className="w-full max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-bold">
                    গিটহাব পিআর লিংক (GitHub PR URL)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Private Repo Fetch</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-white">
                    <span className="truncate text-indigo-300">
                      {typedText || 'https://github.com/my-username/private-api/pull/1'}
                      <span className="animate-pulse text-indigo-400">|</span>
                    </span>
                    <button className={`px-3 py-1 rounded text-xs font-bold text-white transition-all ${isClicked ? 'bg-indigo-400 scale-95' : 'bg-indigo-600'}`}>
                      Fetch PR
                    </button>
                  </div>

                  {isSuccessState && (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between font-mono">
                      <span>✓ 200 OK: 3 Private Changed Files Loaded (+45 / -12)</span>
                      <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded text-white font-sans">
                        Zero 404
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Launch Review & Post to GitHub */}
            {currentStep.id === 5 && (
              <div className="w-full max-w-xl p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white">Multi-Agent Swarm Audit</span>
                  <span className="text-rose-400 font-bold font-mono">Verdict: REQUEST_CHANGES</span>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                  <div className="font-bold">SecOps Agent: Timing Attack in AuthService (CWE-208)</div>
                  <div className="text-[11px] text-rose-200">Suggested patch: crypto.timingSafeEqual replacement</div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between text-xs text-indigo-200">
                  <span className="font-semibold">🚀 Post Review Directly to GitHub PR</span>
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    <span>Submit</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subtitle / Voice Narration Bar */}
          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-center shadow-lg">
            <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
              {isBn ? currentStep.narrationBn : currentStep.narrationEn}
            </p>
          </div>
        </div>

        {/* Video Scrubber & Playback Controls Bar */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 space-y-2">
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-100"
              style={{ width: `${stepProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                <span>{isPlaying ? (isBn ? 'পজ' : 'Pause') : (isBn ? 'প্লে' : 'Play')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : VIDEO_STEPS.length - 1));
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveStepIndex((prev) => (prev + 1) % VIDEO_STEPS.length);
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setStepProgress(0);
                  setIsPlaying(true);
                  speakNarration(isBn ? currentStep.narrationBn : currentStep.narrationEn);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Replay Step"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute voice' : 'Mute voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick 1-Click Action to generate token directly on GitHub */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=OctoAgent-Code-Reviewer"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isBn ? 'সরাসরি GitHub Token বানান ›' : 'Generate GitHub Token ›'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
