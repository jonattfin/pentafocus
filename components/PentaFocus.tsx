"use client";

import React, { useState, useEffect, useRef } from "react";

interface Quote {
  text: string;
  author: string;
}

interface SessionLog {
  id: number;
  date: string;
  durationMins: number;
  task: string;
  element: string;
  quality: string;
}

interface Task {
  id: string;
  title: string;
  quadrant: string;
  done: boolean;
}

interface Volumes {
  earth: number;
  fire: number;
  wind: number;
  water: number;
  heart: number;
}

/* Quotes Dataset */
const QUOTES: Quote[] = [
  { text: "Attention is the rarest and purest form of generosity.", author: "Simone Weil" },
  { text: "Deep work is the superpower of the 21st century economy.", author: "Cal Newport" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Flow is the state of total immersion in an activity.", author: "Mihaly Csikszentmihalyi" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" }
];

export default function PentaFocus() {
  // Navigation View State ('home', 'app', or 'analytics')
  const [view, setView] = useState<'home' | 'app' | 'analytics'>('app');

  // Pro Modal Controls
  const [isProOpen, setIsProOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Keyboard listener for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProOpen) {
        setIsProOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProOpen]);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Analytics Session Logs State
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([
    { id: 1, date: 'Today', durationMins: 25, task: 'Complete Project Architecture Blueprint', element: 'Earth', quality: 'Flow State (9/10)' },
    { id: 2, date: 'Today', durationMins: 50, task: 'Review Urgent Server Logs', element: 'Fire', quality: 'High Focus (8/10)' },
    { id: 3, date: 'Yesterday', durationMins: 25, task: 'Organize Email Inbox', element: 'Water', quality: 'Moderate (6/10)' },
    { id: 4, date: '2 days ago', durationMins: 50, task: 'Refactor Core DSP Audio Engines', element: 'Heart', quality: 'Flow State (10/10)' },
  ]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(150);

  // Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Tasks Matrix State
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Complete Project Architecture Blueprint', quadrant: 'q2', done: false },
    { id: '2', title: 'Review Urgent Server Logs', quadrant: 'q1', done: false },
    { id: '3', title: 'Organize Email Inbox', quadrant: 'q3', done: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskQuad, setNewTaskQuad] = useState('q2');
  const [lockedTaskId, setLockedTaskId] = useState<string | null>('1');

  // Circadian Scrubber State
  const [scrubberHour, setScrubberHour] = useState(10);

  // Audio Volumes State (0 - 100)
  const [volumes, setVolumes] = useState<Volumes>({
    earth: 30,
    fire: 0,
    wind: 0,
    water: 0,
    heart: 20,
  });
  const [isMuted, setIsMuted] = useState(false);

  // Web Audio API References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const synthsRef = useRef<{ [key: string]: GainNode }>({});

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 1.0;
      master.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = master;

      // Generate Brown Noise Buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      // 1. Earth
      const earthSrc = ctx.createBufferSource();
      earthSrc.buffer = noiseBuffer;
      earthSrc.loop = true;
      const earthGain = ctx.createGain();
      earthGain.gain.value = 0.3 * 0.4;
      earthSrc.connect(earthGain);
      earthGain.connect(master);
      earthSrc.start();
      synthsRef.current.earth = earthGain;

      // 2. Fire
      const fireSrc = ctx.createBufferSource();
      fireSrc.buffer = noiseBuffer;
      fireSrc.loop = true;
      const fireFilter = ctx.createBiquadFilter();
      fireFilter.type = 'bandpass';
      fireFilter.frequency.value = 1200;
      const fireGain = ctx.createGain();
      fireGain.gain.value = 0;
      fireSrc.connect(fireFilter);
      fireFilter.connect(fireGain);
      fireGain.connect(master);
      fireSrc.start();
      synthsRef.current.fire = fireGain;

      // 3. Wind
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noiseBuffer;
      windSrc.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 500;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      windSrc.start();
      synthsRef.current.wind = windGain;

      // 4. Water
      const waterSrc = ctx.createBufferSource();
      waterSrc.buffer = noiseBuffer;
      waterSrc.loop = true;
      const waterFilter = ctx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 800;
      const waterGain = ctx.createGain();
      waterGain.gain.value = 0;
      waterSrc.connect(waterFilter);
      waterFilter.connect(waterGain);
      waterGain.connect(master);
      waterSrc.start();
      synthsRef.current.water = waterGain;

      // 5. Heart (Binaural)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.frequency.value = 200;
      oscR.frequency.value = 210;
      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      const heartGain = ctx.createGain();
      heartGain.gain.value = 0.2 * 0.4;
      merger.connect(heartGain);
      heartGain.connect(master);
      oscL.start();
      oscR.start();
      synthsRef.current.heart = heartGain;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  /* Handle Volume Slider Changes */
  const handleVolumeChange = (element: keyof Volumes, value: number) => {
    initAudio();
    setVolumes(prev => ({ ...prev, [element]: value }));
    const gainNode = synthsRef.current[element];
    if (gainNode && audioCtxRef.current) {
      const norm = value / 100;
      gainNode.gain.setTargetAtTime(norm * 0.4, audioCtxRef.current.currentTime, 0.1);
    }
  };

  /* Toggle Master Audio Mute */
  const toggleMute = () => {
    initAudio();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = nextMute ? 0 : 1.0;
    }
  };

  /* Timer Effects & Handlers */
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            const minsCompleted = Math.round(timerTotal / 60);
            setTotalFocusMinutes(m => m + minsCompleted);

            const lockedTaskObj = tasks.find(t => t.id === lockedTaskId);
            const dominantElement = (Object.entries(volumes) as [keyof Volumes, number][]).reduce((a, b) => a[1] > b[1] ? a : b)[0].toUpperCase();
            const newLog: SessionLog = {
              id: Date.now(),
              date: 'Today',
              durationMins: minsCompleted,
              task: lockedTaskObj ? lockedTaskObj.title : 'General Deep Focus',
              element: dominantElement,
              quality: 'Flow State (9/10)'
            };
            setSessionLogs(logs => [newLog, ...logs]);

            showToast(`Sprint Complete! +${minsCompleted} mins logged to analytics.`);
            return timerTotal;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerTotal, lockedTaskId, tasks, volumes]);

  const toggleTimer = () => {
    initAudio();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerSeconds(timerTotal);
  };

  const setPreset = (mins: number) => {
    const secs = mins * 60;
    setTimerTotal(secs);
    setTimerSeconds(secs);
    setIsRunning(false);
  };

  /* Formatting Seconds to MM:SS */
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /* Task Handlers */
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      quadrant: newTaskQuad,
      done: false
    };
    setTasks(prev => [...prev, task]);
    setNewTaskTitle('');
  };

  const toggleTaskDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (lockedTaskId === id) setLockedTaskId(null);
  };

  const lockedTask = tasks.find(t => t.id === lockedTaskId);

  /* Circadian Status Evaluator */
  const getCircadianLabel = (hour: number) => {
    if (hour >= 9 && hour <= 12) return `${hour}:00 - Peak Focus (95% Energy)`;
    if (hour >= 13 && hour <= 16) return `${hour}:00 - Afternoon Slump (40% Energy)`;
    if (hour >= 18 && hour <= 21) return `${hour}:00 - Secondary Rebound (75% Energy)`;
    return `${hour}:00 - Rest & Recovery Phase`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-200 relative overflow-x-hidden">
      {/* Immersive Ambient Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] bg-purple-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/80 backdrop-blur-2xl border border-cyan-400/40 text-cyan-200 font-medium px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center gap-2.5 animate-scale-up">
          <span className="text-cyan-400 text-base">⚡</span>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080c14]/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-cyan-400 font-bold text-lg">⚡</span>
              </div>
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                PENTAFOCUS
              </h1>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest -mt-0.5">
                Chakra Focus Engine
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="bg-slate-900/60 backdrop-blur-md p-1 rounded-full border border-white/10 flex gap-1 shadow-lg">
            <button
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${view === 'home' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setView('home')}
            >
              Home
            </button>
            <button
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${view === 'app' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setView('app')}
            >
              Engine Workspace
            </button>
            <button
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${view === 'analytics' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setView('analytics')}
            >
              📊 Analytics
            </button>
          </div>

          {/* Action Button */}
          <button
            className="text-xs px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)] transition font-medium cursor-pointer"
            onClick={() => setIsProOpen(true)}
          >
            Planeteer Pass 👑
          </button>
        </div>
      </header>

      {/* Main Views Container */}
      <main className="flex-1 py-6 relative z-10">
        {view === 'home' ? (
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-col items-center text-center space-y-8">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-mono text-xs backdrop-blur-md">
                Acoustic & Biological Focus Architecture
              </span>

              <h1 className="font-heading font-black text-4xl sm:text-5xl max-w-4xl leading-tight">
                BY YOUR POWERS COMBINED,<br />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  MASTER PURE FOCUS.
                </span>
              </h1>

              <p className="max-w-2xl text-slate-400 text-base sm:text-lg">
                Unite real-time synthesized audio elements with your 24-hour biological circadian rhythm, Eisenhower matrix priorities, and deep work analytics.
              </p>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setView('app')} className="bg-cyan-500 text-slate-950 font-bold px-8 py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition cursor-pointer">
                  Launch Focus Engine
                </button>
                <button onClick={() => setView('analytics')} className="border border-cyan-500/40 text-cyan-400 px-6 py-3 rounded-xl hover:bg-cyan-500/10 backdrop-blur-md transition cursor-pointer">
                  View Analytics 📊
                </button>
              </div>

              {/* 5 Elemental Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full pt-12">
                <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl text-left">
                  <div className="text-2xl mb-2">⛰️</div>
                  <h3 className="font-heading text-xs font-bold text-amber-400 mb-2">1. Earth</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Deep brown noise frequencies that mask distracting ambient noise and stabilize cognitive grounding.</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-red-500/30 hover:border-red-500/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl text-left">
                  <div className="text-2xl mb-2">🔥</div>
                  <h3 className="font-heading text-xs font-bold text-red-400 mb-2">2. Fire</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Organic timber transients that stimulate dopamine production during intense sprint blocks.</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl text-left">
                  <div className="text-2xl mb-2">💨</div>
                  <h3 className="font-heading text-xs font-bold text-emerald-400 mb-2">3. Wind</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">LFO-modulated bandpass gusts that rhythmically encourage steady task momentum.</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl text-left">
                  <div className="text-2xl mb-2">💧</div>
                  <h3 className="font-heading text-xs font-bold text-cyan-400 mb-2">4. Water</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Filtered rain & stream white-noise textures promoting calm executive processing.</p>
                </div>
                <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 hover:bg-slate-900/60 transition-all duration-300 shadow-xl text-left">
                  <div className="text-2xl mb-2">❤️</div>
                  <h3 className="font-heading text-xs font-bold text-purple-400 mb-2">5. Heart</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Precision 10Hz Alpha Binaural Beats designed to synchronize hemispheric brainwaves into relaxed alertness.</p>
                </div>
              </div>
            </div>
          </div>
        ) : view === 'analytics' ? (
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            {/* Analytics Header / Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all duration-300">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">Total Focus Time</p>
                <p className="text-3xl font-heading font-black text-cyan-400">
                  {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
                </p>
                <p className="text-xs text-emerald-400 mt-2">↑ +18% vs last week</p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl hover:border-purple-500/30 hover:bg-slate-900/60 transition-all duration-300">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">Completed Sprints</p>
                <p className="text-3xl font-heading font-black text-purple-400">
                  {sessionLogs.length} Sessions
                </p>
                <p className="text-xs text-slate-400 mt-2">Average: 37 mins / session</p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl hover:border-amber-500/30 hover:bg-slate-900/60 transition-all duration-300">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">Current Streak</p>
                <p className="text-3xl font-heading font-black text-amber-400">
                  5 Days 🔥
                </p>
                <p className="text-xs text-amber-400 mt-2">Personal best: 14 days</p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">Peak Flow Element</p>
                <p className="text-3xl font-heading font-black text-emerald-400">
                  Earth (45%)
                </p>
                <p className="text-xs text-slate-400 mt-2">Optimal frequency match</p>
              </div>
            </div>

            {/* Weekly Focus Bar Chart & Element Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Weekly Chart */}
              <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Weekly Deep Work Output</h2>
                  <p className="text-xs text-slate-400">Minutes spent in focused sprint states over the past 7 days.</p>
                </div>

                <div className="h-48 flex items-end justify-between gap-2 px-2 pt-8 pb-4">
                  {[
                    { day: 'Mon', mins: 90, height: '60%' },
                    { day: 'Tue', mins: 120, height: '80%' },
                    { day: 'Wed', mins: 60, height: '40%' },
                    { day: 'Thu', mins: 150, height: '100%' },
                    { day: 'Fri', mins: 110, height: '75%' },
                    { day: 'Sat', mins: 45, height: '30%' },
                    { day: 'Sun', mins: totalFocusMinutes, height: `${Math.min(100, (totalFocusMinutes / 150) * 100)}%` },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-mono text-cyan-400">{item.mins}m</span>
                      <div
                        className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-lg transition-all hover:brightness-125"
                        style={{ height: item.height }}
                      />
                      <span className="text-xs text-slate-400 font-mono">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Element Breakdown */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Elemental Resonance</h2>
                  <p className="text-xs text-slate-400">Soundtrack preference split.</p>
                </div>

                <div className="space-y-3 py-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-400">⛰️ Earth (Brown Noise)</span>
                      <span className="font-mono">45%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-purple-400">❤️ Heart (Binaural)</span>
                      <span className="font-mono">25%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-cyan-400">💧 Water (Rain)</span>
                      <span className="font-mono">15%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400">🔥 Fire / 💨 Wind</span>
                      <span className="font-mono">15%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-xs text-slate-400">
                  💡 Tip: Pairing Earth noise with Q2 tasks yields your highest completion rate.
                </div>
              </div>
            </div>

            {/* Recent Session Logs */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Recent Completed Sprint Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono">
                      <th className="pb-3">TIME & DATE</th>
                      <th className="pb-3">OBJECTIVE / TASK</th>
                      <th className="pb-3">PRIMARY ELEMENT</th>
                      <th className="pb-3">DURATION</th>
                      <th className="pb-3">FLOW STATE QUALITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 font-mono text-slate-400">{log.date}</td>
                        <td className="py-3 font-semibold text-slate-200">{log.task}</td>
                        <td className="py-3 font-mono text-cyan-400">{log.element}</td>
                        <td className="py-3 font-mono">{log.durationMins} mins</td>
                        <td className="py-3 text-emerald-400">{log.quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            {/* SECTION 1: MAIN FOCUS CIRCLE & QUOTE CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Quotes Card */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      Focus Resonance
                    </span>
                    <button
                      onClick={() => setQuoteIndex((quoteIndex + 1) % QUOTES.length)}
                      className="text-xs text-slate-400 hover:text-cyan-400 p-1 transition cursor-pointer"
                      title="Refresh Quote"
                    >
                      🔄
                    </button>
                  </div>
                  <p className="italic text-slate-200 text-base leading-relaxed pt-2">
                    &ldquo;{QUOTES[quoteIndex].text}&rdquo;
                  </p>
                  <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest">
                    — {QUOTES[quoteIndex].author}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6">
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Locked Focus Objective
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {lockedTask ? lockedTask.title : 'No task locked. Select from matrix below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center: MAIN FOCUS PLANET & SATELLITES SYSTEM */}
              <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5),0_0_30px_rgba(6,182,212,0.12)] flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
                {/* Background Space Dust & Starfield */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-[15%] left-[12%] w-1 h-1 rounded-full bg-cyan-200 animate-star-twinkle-1" />
                  <div className="absolute top-[28%] right-[18%] w-1.5 h-1.5 rounded-full bg-purple-200 animate-star-twinkle-2" />
                  <div className="absolute bottom-[20%] left-[22%] w-1 h-1 rounded-full bg-blue-100 animate-star-twinkle-3" />
                  <div className="absolute bottom-[25%] right-[14%] w-1 h-1 rounded-full bg-amber-200 animate-star-twinkle-1" />
                  <div className="absolute top-[65%] left-[8%] w-1.5 h-1.5 rounded-full bg-emerald-200 animate-star-twinkle-2" />
                  <div className="absolute top-[10%] right-[35%] w-1 h-1 rounded-full bg-slate-300 animate-star-twinkle-3" />
                  {/* Subtle Planetary Orbit Nebula Glow */}
                  <div className="absolute inset-0 bg-radial from-cyan-900/10 via-transparent to-transparent" />
                </div>

                {/* Center Planetary & Orbital Elements Container */}
                <div className="relative flex items-center justify-center w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] my-3">
                  {/* Orbital Track 1: High Elliptical Inclination (Cor-05 Heart Pulsar) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 360 360" className="opacity-40" style={{ transform: 'rotate(-25deg)' }}>
                      <ellipse cx="180" cy="180" rx="165" ry="150" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="5 5" opacity="0.45" />
                    </svg>
                  </div>

                  {/* Orbital Track 2: Mid Inclination (Aqua-03 & Terra-04) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 360 360" className="opacity-50" style={{ transform: 'rotate(20deg)' }}>
                      <ellipse cx="180" cy="180" rx="138" ry="130" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.5" />
                    </svg>
                  </div>

                  {/* Orbital Track 3: Inner Fast Orbit (Ignis-01 & Aero-02) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 360 360" className="opacity-60" style={{ transform: 'rotate(-10deg)' }}>
                      <ellipse cx="180" cy="180" rx="112" ry="108" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                    </svg>
                  </div>

                  {/* BACK LAYER: Planetary Rings (Behind Planet Core) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <svg width="340" height="140" viewBox="0 0 340 140" className="opacity-80" style={{ transform: 'rotate(-22deg)' }}>
                      <ellipse cx="170" cy="70" rx="155" ry="42" fill="none" stroke="url(#ringGradOuter)" strokeWidth="6" opacity="0.35" />
                      <ellipse cx="170" cy="70" rx="142" ry="38" fill="none" stroke="url(#ringGradInner)" strokeWidth="14" opacity="0.25" />
                      <ellipse cx="170" cy="70" rx="122" ry="32" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" strokeDasharray="8 4" />
                      <defs>
                        <linearGradient id="ringGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="ringGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                          <stop offset="50%" stopColor="#0284c7" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* ORBITING SATELLITE SYSTEM 1: Inner Fast Track (Clockwise) */}
                  <div
                    className="absolute w-full h-full pointer-events-none"
                    style={{
                      animation: `spin ${isRunning ? '12s' : '24s'} linear infinite`,
                    }}
                  >
                    {/* Satellite 1: Sol-Fire (Orbital Solar Probe) */}
                    <div
                      className="absolute top-[8px] left-1/2 -translate-x-1/2 group pointer-events-auto cursor-pointer"
                      title="Sol-Fire Probe (Stimulation / Sprint Energy)"
                    >
                      <div className="relative flex items-center justify-center">
                        {/* Probe Solar Wing Left */}
                        <div className="w-2.5 h-1 bg-cyan-900 border border-cyan-400/80 rounded-[1px] shadow-[0_0_6px_#06b6d4]" />
                        {/* Probe Main Hull */}
                        <div className="w-3.5 h-3.5 mx-0.5 rounded-sm bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-300 border border-yellow-200 flex items-center justify-center shadow-[0_0_14px_#ef4444]">
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                        </div>
                        {/* Probe Solar Wing Right */}
                        <div className="w-2.5 h-1 bg-cyan-900 border border-cyan-400/80 rounded-[1px] shadow-[0_0_6px_#06b6d4]" />
                        {/* Thruster Plume */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-gradient-to-t from-red-500 to-transparent rounded-full animate-thruster" />
                      </div>
                    </div>

                    {/* Satellite 2: Zephyr-Wind (Atmospheric Skimmer) */}
                    <div
                      className="absolute bottom-[8px] left-1/2 -translate-x-1/2 group pointer-events-auto cursor-pointer"
                      title="Zephyr-Wind Skimmer (Task Momentum)"
                    >
                      <div className="relative flex items-center justify-center">
                        {/* Sleek Sweep Wing */}
                        <div className="w-2 h-1 bg-emerald-950 border border-emerald-400/80 rounded-[1px]" />
                        {/* Aerostat Orb Hull */}
                        <div className="w-3 h-3 mx-0.5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-300 border border-emerald-300 shadow-[0_0_12px_#10b981] flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                        <div className="w-2 h-1 bg-emerald-950 border border-emerald-400/80 rounded-[1px]" />
                        {/* Thruster Plume */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-gradient-to-b from-emerald-400 to-transparent rounded-full animate-thruster" />
                      </div>
                    </div>
                  </div>

                  {/* ORBITING SATELLITE SYSTEM 2: Mid Inclination Track (Counter-Clockwise) */}
                  <div
                    className="absolute w-full h-full pointer-events-none"
                    style={{
                      animation: `spin-reverse ${isRunning ? '16s' : '32s'} linear infinite`,
                    }}
                  >
                    {/* Satellite 3: Hydro-Water (Cryo Station) */}
                    <div
                      className="absolute top-1/2 right-[12px] -translate-y-1/2 group pointer-events-auto cursor-pointer"
                      title="Hydro-Water Station (Calm Processing)"
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        {/* Solar Truss Top */}
                        <div className="w-1 h-2 bg-cyan-950 border border-cyan-400/70" />
                        {/* Station Module Core */}
                        <div className="w-3.5 h-3.5 my-0.5 rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 border border-cyan-200 shadow-[0_0_14px_#06b6d4] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-100" />
                        </div>
                        {/* Solar Truss Bottom */}
                        <div className="w-1 h-2 bg-cyan-950 border border-cyan-400/70" />
                        {/* Ion Thruster Glow */}
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-1 bg-gradient-to-r from-cyan-400 to-transparent rounded-full animate-thruster" />
                      </div>
                    </div>

                    {/* Satellite 4: Geo-Earth (Surveyor Satellite) */}
                    <div
                      className="absolute top-1/2 left-[12px] -translate-y-1/2 group pointer-events-auto cursor-pointer"
                      title="Geo-Earth Surveyor (Cognitive Grounding)"
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        {/* Gold Solar Panel Upper */}
                        <div className="w-1 h-2.5 bg-amber-950 border border-amber-400/80 rounded-[1px]" />
                        {/* Surveyor Hull */}
                        <div className="w-3.5 h-3.5 my-0.5 rounded-sm bg-gradient-to-tr from-amber-700 via-amber-500 to-yellow-400 border border-amber-200 shadow-[0_0_12px_#f59e0b] flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]" />
                        </div>
                        {/* Gold Solar Panel Lower */}
                        <div className="w-1 h-2.5 bg-amber-950 border border-amber-400/80 rounded-[1px]" />
                        {/* Ion Thruster Glow */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-1 bg-gradient-to-l from-amber-400 to-transparent rounded-full animate-thruster" />
                      </div>
                    </div>
                  </div>

                  {/* ORBITING SATELLITE SYSTEM 3: Outer High-Inclination Track (Clockwise Slow) */}
                  <div
                    className="absolute w-full h-full pointer-events-none"
                    style={{
                      animation: `spin ${isRunning ? '20s' : '40s'} linear infinite`,
                    }}
                  >
                    {/* Satellite 5: Cor-05 (Heart Alpha-Wave Transmitter) */}
                    <div
                      className="absolute top-[28px] right-[28px] group pointer-events-auto cursor-pointer"
                      title="Cor-05 Pulsar (10Hz Alpha Synchronization)"
                    >
                      <div className="relative flex items-center justify-center">
                        {/* Alpha Wave Beacon Pulse Ring */}
                        <div className="absolute w-8 h-8 rounded-full border border-purple-400/60 animate-beacon pointer-events-none" />
                        {/* Probe Cross Wing Truss */}
                        <div className="w-2.5 h-1 bg-purple-950 border border-purple-400/70" />
                        {/* Quantum Transmitter Core */}
                        <div className="w-3.5 h-3.5 mx-0.5 rounded-full bg-gradient-to-tr from-purple-700 via-fuchsia-500 to-pink-300 border border-purple-200 shadow-[0_0_16px_#c084fc] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                        </div>
                        <div className="w-2.5 h-1 bg-purple-950 border border-purple-400/70" />
                      </div>
                    </div>
                  </div>

                  {/* CENTRAL CELESTIAL PLANET (The Focus Core Sphere) */}
                  <div
                    className={`z-10 w-[184px] h-[184px] sm:w-[196px] sm:h-[196px] rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${
                      isRunning ? 'animate-planet-atmosphere-active' : 'animate-planet-atmosphere'
                    }`}
                    style={{
                      background: 'radial-gradient(circle at 32% 26%, #1e293b 0%, #0f172a 38%, #030712 75%, #000208 100%)',
                    }}
                  >
                    {/* Planetary Atmospheric Contour Curvatures & Surface Bands */}
                    <svg
                      viewBox="0 0 200 200"
                      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                    >
                      <path d="M 10,70 Q 100,105 190,70" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      <path d="M 0,100 Q 100,135 200,100" fill="none" stroke="#818cf8" strokeWidth="3" />
                      <path d="M 15,130 Q 100,165 185,130" fill="none" stroke="#06b6d4" strokeWidth="2" />
                    </svg>

                    {/* Planet Rim Specular Highlight (Upper Left Light Source) */}
                    <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-cyan-400/15 blur-xl pointer-events-none" />

                    {/* Holographic HUD Cardinal Coordinate Markers */}
                    <div className="absolute inset-2 rounded-full border border-cyan-400/20 border-dashed pointer-events-none" />

                    {/* Planet Core Timer HUD */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-mono tracking-widest text-cyan-300/80 uppercase">
                          PLANET PENTA
                        </span>
                      </div>

                      <span className="font-heading font-black text-3xl sm:text-4xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        {formatTime(timerSeconds)}
                      </span>

                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/60 border border-white/10 text-cyan-400 font-semibold shadow-sm">
                        {isRunning ? '🪐 ORBITAL FLOW ACTIVE' : 'READY TO FOCUS'}
                      </span>
                    </div>
                  </div>

                  {/* FRONT LAYER: Planetary Rings Front Segment (Crossing Planet) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <svg width="340" height="140" viewBox="0 0 340 140" className="opacity-90" style={{ transform: 'rotate(-22deg)' }}>
                      {/* Mask to render only front half of the ring */}
                      <defs>
                        <clipPath id="frontRingClip">
                          <rect x="0" y="70" width="340" height="70" />
                        </clipPath>
                      </defs>
                      <g clipPath="url(#frontRingClip)">
                        <ellipse cx="170" cy="70" rx="155" ry="42" fill="none" stroke="url(#ringGradOuter)" strokeWidth="6" opacity="0.45" />
                        <ellipse cx="170" cy="70" rx="142" ry="38" fill="none" stroke="url(#ringGradInner)" strokeWidth="14" opacity="0.35" />
                        <ellipse cx="170" cy="70" rx="122" ry="32" fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8" strokeDasharray="8 4" />
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Controls & Presets */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 z-10">
                  <button
                    onClick={toggleTimer}
                    className={`px-6 py-2 rounded-xl font-bold transition shadow-lg cursor-pointer ${
                      isRunning ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                    }`}
                  >
                    {isRunning ? 'PAUSE VOYAGE' : 'START VOYAGE'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 border border-white/10 hover:border-white/30 bg-slate-950/40 backdrop-blur-sm text-slate-300 rounded-xl transition cursor-pointer"
                    title="Reset Timer"
                  >
                    🔄
                  </button>
                  <div className="h-6 w-px bg-white/10 mx-1" />
                  <button onClick={() => setPreset(50)} className="text-xs px-3 py-1.5 border border-white/10 bg-slate-950/30 backdrop-blur-sm rounded-lg hover:border-cyan-500/50 hover:bg-cyan-500/10 transition cursor-pointer">50m</button>
                  <button onClick={() => setPreset(25)} className="text-xs px-3 py-1.5 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 backdrop-blur-sm transition font-medium cursor-pointer">25m</button>
                  <button onClick={() => setPreset(15)} className="text-xs px-3 py-1.5 border border-white/10 bg-slate-950/30 backdrop-blur-sm rounded-lg hover:border-cyan-500/50 hover:bg-cyan-500/10 transition cursor-pointer">15m</button>
                </div>
              </div>
            </div>

            {/* SECTION 2: EISENHOWER MATRIX WORKSPACE */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Eisenhower Action Matrix
                  </h2>
                  <p className="text-xs text-slate-400">Prioritize tasks by urgency and importance. Lock a task to set your focus target.</p>
                </div>

                {/* Add Task Form */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Add new task..."
                    className="bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400 flex-1 sm:w-48 text-slate-200"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <select
                    className="bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-400 text-slate-200 cursor-pointer"
                    value={newTaskQuad}
                    onChange={(e) => setNewTaskQuad(e.target.value)}
                  >
                    <option value="q1">Q1: Do First</option>
                    <option value="q2">Q2: Deep Work</option>
                    <option value="q3">Q3: Delegate</option>
                    <option value="q4">Q4: Eliminate</option>
                  </select>
                  <button onClick={handleAddTask} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer">
                    +
                  </button>
                </div>
              </div>

              {/* 4 Quadrants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1 */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 min-h-[120px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-red-400 font-mono">Q1: URGENT & IMPORTANT (DO FIRST)</span>
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {tasks.filter(t => t.quadrant === 'q1').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.quadrant === 'q1').map(t => (
                      <div key={t.id} className={`flex justify-between items-center p-2 rounded-xl border transition ${lockedTaskId === t.id ? 'bg-slate-900/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/30 backdrop-blur-sm border-white/5 hover:border-white/15'}`}>
                        <div className="flex items-center gap-2 flex-1 mr-2 cursor-pointer" onClick={() => toggleTaskDone(t.id)}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="accent-cyan-500 cursor-pointer" />
                          <span className={`text-xs ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLockedTaskId(t.id)} className={`p-1 rounded text-xs cursor-pointer ${lockedTaskId === t.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Lock Target">🎯</button>
                          <button onClick={() => deleteTask(t.id)} className="p-1 rounded text-xs text-slate-500 hover:text-red-400 cursor-pointer" title="Delete Task">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 min-h-[120px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-cyan-400 font-mono">Q2: DEEP WORK (SCHEDULE)</span>
                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {tasks.filter(t => t.quadrant === 'q2').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.quadrant === 'q2').map(t => (
                      <div key={t.id} className={`flex justify-between items-center p-2 rounded-xl border transition ${lockedTaskId === t.id ? 'bg-slate-900/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/30 backdrop-blur-sm border-white/5 hover:border-white/15'}`}>
                        <div className="flex items-center gap-2 flex-1 mr-2 cursor-pointer" onClick={() => toggleTaskDone(t.id)}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="accent-cyan-500 cursor-pointer" />
                          <span className={`text-xs ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLockedTaskId(t.id)} className={`p-1 rounded text-xs cursor-pointer ${lockedTaskId === t.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Lock Target">🎯</button>
                          <button onClick={() => deleteTask(t.id)} className="p-1 rounded text-xs text-slate-500 hover:text-red-400 cursor-pointer" title="Delete Task">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q3 */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 min-h-[120px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-amber-400 font-mono">Q3: URGENT & NOT IMPORTANT (DELEGATE)</span>
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {tasks.filter(t => t.quadrant === 'q3').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.quadrant === 'q3').map(t => (
                      <div key={t.id} className={`flex justify-between items-center p-2 rounded-xl border transition ${lockedTaskId === t.id ? 'bg-slate-900/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/30 backdrop-blur-sm border-white/5 hover:border-white/15'}`}>
                        <div className="flex items-center gap-2 flex-1 mr-2 cursor-pointer" onClick={() => toggleTaskDone(t.id)}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="accent-cyan-500 cursor-pointer" />
                          <span className={`text-xs ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLockedTaskId(t.id)} className={`p-1 rounded text-xs cursor-pointer ${lockedTaskId === t.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Lock Target">🎯</button>
                          <button onClick={() => deleteTask(t.id)} className="p-1 rounded text-xs text-slate-500 hover:text-red-400 cursor-pointer" title="Delete Task">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q4 */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 min-h-[120px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 font-mono">Q4: LOW VALUE (ELIMINATE)</span>
                    <span className="bg-slate-800/60 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {tasks.filter(t => t.quadrant === 'q4').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.quadrant === 'q4').map(t => (
                      <div key={t.id} className={`flex justify-between items-center p-2 rounded-xl border transition ${lockedTaskId === t.id ? 'bg-slate-900/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/30 backdrop-blur-sm border-white/5 hover:border-white/15'}`}>
                        <div className="flex items-center gap-2 flex-1 mr-2 cursor-pointer" onClick={() => toggleTaskDone(t.id)}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="accent-cyan-500 cursor-pointer" />
                          <span className={`text-xs ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setLockedTaskId(t.id)} className={`p-1 rounded text-xs cursor-pointer ${lockedTaskId === t.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Lock Target">🎯</button>
                          <button onClick={() => deleteTask(t.id)} className="p-1 rounded text-xs text-slate-500 hover:text-red-400 cursor-pointer" title="Delete Task">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: CIRCADIAN TELEMETRY */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Circadian Biorhythm Telemetry</h2>
                  <p className="text-xs text-slate-400">Scrub the timeline to evaluate your natural cognitive energy state across 24 hours.</p>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl font-mono text-xs backdrop-blur-md">
                  {getCircadianLabel(scrubberHour)}
                </span>
              </div>

              {/* SVG Graph Container */}
              <div className="w-full h-28 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden relative p-2">
                <svg width="100%" height="100%" viewBox="0 0 1000 150" preserveAspectRatio="none">
                  <line x1="0" y1="30" x2="1000" y2="30" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="0" y1="75" x2="1000" y2="75" stroke="#1e293b" strokeDasharray="4 4" />
                  <path d="M 0,130 C 150,130 200,30 350,30 C 500,30 550,110 650,110 C 750,110 800,60 900,60 C 950,60 1000,130 1000,130" fill="none" stroke="#06b6d4" strokeWidth="3" />
                  <line x1={(scrubberHour / 24) * 1000} y1="0" x2={(scrubberHour / 24) * 1000} y2="150" stroke="#a855f7" strokeWidth="2" strokeDasharray="2 2" />
                </svg>
              </div>

              {/* Scrubber Slider */}
              <div className="pt-4 space-y-1">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={scrubberHour}
                  onChange={(e) => setScrubberHour(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>00:00 (Sleep)</span>
                  <span>06:00 (Wake)</span>
                  <span>10:00 (Peak Flow)</span>
                  <span>15:00 (Slump)</span>
                  <span>20:00 (Rebound)</span>
                  <span>24:00 (Rest)</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: 5-RING ELEMENTAL AUDIO MIXER (BOTTOM) */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">5-Ring Elemental Audio Mixer</h2>
                  <p className="text-xs text-slate-400">Synthesize customized background soundscapes in real-time using Web Audio DSP.</p>
                </div>
                <button
                  onClick={toggleMute}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer backdrop-blur-md ${isMuted ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'}`}
                >
                  {isMuted ? 'MUTED 🔇' : 'AUDIO ACTIVE 🔊'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Earth */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-amber-400">⛰️ Earth</span>
                    <span className="text-xs font-mono text-slate-400">{volumes.earth}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes.earth}
                    onChange={(e) => handleVolumeChange('earth', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">Brown Noise Rumble</p>
                </div>

                {/* Fire */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 hover:border-red-500/60 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-400">🔥 Fire</span>
                    <span className="text-xs font-mono text-slate-400">{volumes.fire}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes.fire}
                    onChange={(e) => handleVolumeChange('fire', parseInt(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">Timber Crackle</p>
                </div>

                {/* Wind */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-emerald-400">💨 Wind</span>
                    <span className="text-xs font-mono text-slate-400">{volumes.wind}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes.wind}
                    onChange={(e) => handleVolumeChange('wind', parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">LFO Gust Sweep</p>
                </div>

                {/* Water */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-cyan-400">💧 Water</span>
                    <span className="text-xs font-mono text-slate-400">{volumes.water}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes.water}
                    onChange={(e) => handleVolumeChange('water', parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">Rain & Stream</p>
                </div>

                {/* Heart */}
                <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-purple-400">❤️ Heart</span>
                    <span className="text-xs font-mono text-slate-400">{volumes.heart}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes.heart}
                    onChange={(e) => handleVolumeChange('heart', parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">10Hz Alpha Waves</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Planeteer Pass Pro Modal */}
      {isProOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xl animate-fade-in transition-all duration-300"
          onClick={() => setIsProOpen(false)}
        >
          <div
            className="relative bg-slate-900/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.2)] space-y-6 overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow Spheres inside modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsProOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="text-center relative z-10 space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-2xl shadow-[0_0_20px_rgba(245,158,11,0.25)] mb-1">
                👑
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                Planeteer Pass
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Unlock lifetime elemental audio synthesis, custom biorhythm curves & sleep telemetry integration.
              </p>
            </div>

            {/* Feature Cards with Glassmorphism */}
            <div className="space-y-2.5 relative z-10">
              <div className="p-3.5 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-amber-500/30 hover:bg-slate-900/40 transition flex items-start gap-3">
                <span className="text-amber-400 text-sm mt-0.5">✨</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Unlimited 5-Element Soundscapes</h4>
                  <p className="text-[11px] text-slate-400">Layer Earth, Fire, Wind, Water & Heart Alpha synths simultaneously with zero duration limits.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-slate-900/40 transition flex items-start gap-3">
                <span className="text-cyan-400 text-sm mt-0.5">⚡</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Custom Circadian Curves & Bio-Sync</h4>
                  <p className="text-[11px] text-slate-400">Calibrate your peak ultradian rhythm according to your exact sleep cycles and chronotype.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-slate-900/40 transition flex items-start gap-3">
                <span className="text-purple-400 text-sm mt-0.5">🔮</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Zen Immersion Shaders & Particle Effects</h4>
                  <p className="text-[11px] text-slate-400">Dynamic orbital celestial shaders that react harmonically to audio synth frequencies.</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="relative z-10 pt-2">
              <button
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-heading font-black py-3.5 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm tracking-wide"
                onClick={() => {
                  showToast('👑 Lifetime Access Granted! Welcome Planeteer.');
                  setIsProOpen(false);
                }}
              >
                Claim Lifetime Access • $29 USD
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2 font-mono">
                One-time payment • Instant activation • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center text-xs text-slate-500 font-mono relative z-10">
        PENTAFOCUS Engine • Powered by You
      </footer>
    </div>
  );
}
