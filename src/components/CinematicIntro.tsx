import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DailyQuestSlot } from '../types';
import { soundFx } from '../utils/sound';
import { ArrowRight, Radio } from 'lucide-react';

interface CinematicIntroProps {
  user: UserProfile;
  dailyQuests: DailyQuestSlot[];
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ user, dailyQuests, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState('');
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Live user statistics calculation
  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalCount = dailyQuests.length;
  const targetPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const targetText = `WELCOME BACK, ${(user.username || 'HUNTER').toUpperCase()}`;

  // 1. HTML5 Canvas Particles Effect (Drifting electric-blue particle dust)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle Array
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      speedY: -(Math.random() * 0.6 + 0.2),
      speedX: (Math.random() - 0.5) * 0.4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Timed Opening Sequence Setup
  useEffect(() => {
    soundFx.playBlip(400, 'sawtooth');

    // Stage 1: Frame Glitch Slam (0.3s)
    const t1 = setTimeout(() => setStage(1), 300);

    // Stage 2: Typewriter text reveal (1.0s)
    const t2 = setTimeout(() => setStage(2), 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // 3. Typewriter Effect for "WELCOME BACK, {USER_NAME}"
  useEffect(() => {
    if (stage < 2) return;

    let charIdx = 0;
    const interval = setInterval(() => {
      setDisplayedText(targetText.slice(0, charIdx + 1));
      soundFx.playBlip(750 + charIdx * 25, 'sine');
      charIdx++;

      if (charIdx >= targetText.length) {
        clearInterval(interval);
        // Stage 3: SVG Ring & Stat lines reveal
        setTimeout(() => setStage(3), 200);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [stage, targetText]);

  // 4. Animate SVG Progress Ring from 0 to targetPercent in Stage 3
  useEffect(() => {
    if (stage < 3) return;

    soundFx.playLevelUp();
    let current = 0;
    const step = Math.max(1, Math.ceil(targetPercent / 40));

    const progressTimer = setInterval(() => {
      current += step;
      if (current >= targetPercent) {
        setAnimatedProgress(targetPercent);
        clearInterval(progressTimer);
      } else {
        setAnimatedProgress(current);
      }
    }, 30);

    // Auto complete & fade out after 4.2s
    const fadeTimer = setTimeout(() => {
      setStage(4);
      setTimeout(onComplete, 600);
    }, 4200);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
    };
  }, [stage, targetPercent, onComplete]);

  // Handle ESC or Click Skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSkip = () => {
    soundFx.playBlip(1000);
    sessionStorage.setItem('system_window_intro_played', 'true');
    onComplete();
  };

  // SVG Circumference calculation for r = 40 (2 * pi * 40 ≈ 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * animatedProgress) / 100;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#05020a] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden transition-opacity duration-700 ${
        stage === 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* HTML5 Canvas Drifting Purple Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Atmospheric Purple Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow z-0" />

      {/* Main Translucent White Frame with Purple System Energy */}
      <div
        className={`max-w-xl w-full system-panel-glow p-8 sm:p-10 rounded-2xl border-2 border-white/30 relative z-10 transition-all duration-400 shadow-[0_0_60px_rgba(168,85,247,0.5)] ${
          stage >= 1 ? 'scale-100 opacity-100 animate-window-open' : 'scale-90 opacity-0'
        }`}
      >
        <div className="animate-scanline" />

        {/* Top Header System Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-white/10 border border-white/30 text-purple-300 font-mono text-xs mb-6 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
          <Radio className="w-4 h-4 text-purple-300 animate-pulse" />
          <span>[SYSTEM ANALYSIS PROTOCOL]</span>
        </div>

        {/* Letter-by-letter Welcome Title */}
        <div className="min-h-[64px] flex items-center justify-center mb-6">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-wide text-glow leading-tight">
            {displayedText}
            {stage === 2 && <span className="animate-pulse text-purple-300 ml-1">|</span>}
          </h1>
        </div>

        {/* Stage 3: Animated SVG Circular Progress Ring & Slide-Up Live User Stats */}
        {stage >= 3 && (
          <div className="space-y-6 animate-window-open">
            <div className="h-px bg-white/15 w-full" />

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 text-left">
              {/* SVG Circular Progress Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#a855f7"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-mono font-bold text-xl text-white text-glow">
                    {animatedProgress}%
                  </span>
                  <span className="block text-[9px] font-mono text-purple-300">CLEARANCE</span>
                </div>
              </div>

              {/* Live User Stat Lines */}
              <div className="space-y-2 font-mono text-xs text-left w-full sm:w-auto">
                <div className="bg-white/5 p-2.5 rounded-lg border border-white/15 shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center justify-between gap-4">
                  <span className="text-white/60 text-[10px]">GOALS COMPLETED:</span>
                  <span className="font-bold text-white">
                    {completedCount} / {totalCount}
                  </span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-lg border border-white/15 shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center justify-between gap-4">
                  <span className="text-white/60 text-[10px]">STREAK:</span>
                  <span className="font-bold text-purple-300">
                    {user.streak || 0} DAYS
                  </span>
                </div>

                <div className="bg-white/5 p-2.5 rounded-lg border border-white/15 shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center justify-between gap-4">
                  <span className="text-white/60 text-[10px]">HUNTER RANK:</span>
                  <span className="font-bold text-white">{user.rank || 'E'}-RANK</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 hex-btn px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-mono text-xs flex items-center space-x-1.5 transition shadow-[0_0_15px_rgba(168,85,247,0.3)] z-20"
      >
        <span>ENTER SYSTEM [ESC]</span>
        <ArrowRight className="w-4 h-4 text-purple-300" />
      </button>
    </div>
  );
};
