
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Activity, 
  Target, 
  ChevronRight, 
  Play, 
  AlertCircle, 
  Award, 
  Dumbbell,
  CheckCircle2,
  Cpu, 
  X, 
  Clock, 
  ChevronLeft, 
  Copy, 
  Check, 
  Send, 
  Pause, 
  RotateCcw, 
  MessageSquare, 
  Sparkles,
  Heart,
  Brain,
  ZapIcon,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Music,
  ArrowLeft,
  Calendar,
  Coffee,
  CheckCircle,
  ExternalLink,
  ImageIcon,
  Layout,
  Download,
  AlertTriangle,
  Wand2,
  Eraser,
  Palette,
  FastForward
} from 'lucide-react';
import { ROUTINES, PROGRAMS, EQUIPMENTS } from './constants.ts';
import { generateCustomRoutine, createChatSession, generateAiImage, editAiImage } from './services/gemini.ts';
import { Difficulty, Routine, Program } from './types.ts';

const App: React.FC = () => {
  // Navigation States
  const [activeTab, setActiveTab] = useState<Difficulty>(Difficulty.BEGINNER);
  const [isRoutinesPageOpen, setIsRoutinesPageOpen] = useState(false);
  const [isProgramPageOpen, setIsProgramPageOpen] = useState(false);

  // AI Generator States
  const [aiGoal, setAiGoal] = useState('');
  const [aiLevel, setAiLevel] = useState('Principiante');
  const [aiTime, setAiTime] = useState('15');
  const [customRoutine, setCustomRoutine] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Image States
  const [imagePrompt, setImagePrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'generate' | 'edit'>('generate');

  // Modal & Selection States
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  
  // Timer & Loop States
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalStepTime, setTotalStepTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const timerRef = useRef<number | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatSessionRef = useRef<any>(null);

  // --- LOGIC HELPERS ---

  const parseDuration = (text: string): number => {
    const match = text.match(/(\d+)s/);
    if (match) return parseInt(match[1], 10);
    const minMatch = text.match(/(\d+) min/);
    if (minMatch) return parseInt(minMatch[1], 10) * 60;
    return 0;
  };

  const parseRounds = (text: string): number | null => {
    const match = text.toLowerCase().match(/(\d+) rondas/);
    return match ? parseInt(match[1], 10) : null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (selectedRoutine) {
        const timedExercises = selectedRoutine.exercises.filter(ex => parseDuration(ex) > 0);
        const currentTimedIndex = timedExercises.indexOf(selectedRoutine.exercises[currentStepIndex]);
        
        if (currentTimedIndex < timedExercises.length - 1) {
          const nextEx = timedExercises[currentTimedIndex + 1];
          const nextIdx = selectedRoutine.exercises.indexOf(nextEx);
          setCurrentStepIndex(nextIdx);
          const duration = parseDuration(nextEx);
          setTimeLeft(duration);
          setTotalStepTime(duration);
        } else {
          if (currentRound < totalRounds) {
            setCurrentRound(prev => prev + 1);
            const firstTimedEx = timedExercises[0];
            setCurrentStepIndex(selectedRoutine.exercises.indexOf(firstTimedEx));
            const duration = parseDuration(firstTimedEx);
            setTimeLeft(duration);
            setTotalStepTime(duration);
          } else {
            setIsTimerActive(false);
            setWorkoutFinished(true);
          }
        }
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft, currentStepIndex, currentRound, totalRounds, selectedRoutine]);

  useEffect(() => {
    if (selectedRoutine && !workoutFinished && timeLeft === 0 && !isTimerActive) {
      const timed = selectedRoutine.exercises.filter(ex => parseDuration(ex) > 0);
      const roundsStep = selectedRoutine.exercises.find(ex => parseRounds(ex));
      if (timed.length > 0) {
        const firstTimed = timed[0];
        setCurrentStepIndex(selectedRoutine.exercises.indexOf(firstTimed));
        const duration = parseDuration(firstTimed);
        setTimeLeft(duration);
        setTotalStepTime(duration);
      }
      setCurrentRound(1);
      setTotalRounds(roundsStep ? parseRounds(roundsStep) || 1 : 1);
    }
  }, [selectedRoutine, workoutFinished]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- ACTIONS ---

  const handleGenerateAiRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAi(true);
    const routine = await generateCustomRoutine(aiGoal, aiLevel, aiTime);
    setCustomRoutine(routine);
    setLoadingAi(false);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setShowKeyPrompt(true);
      return;
    }

    setIsGeneratingImage(true);
    try {
      const url = await generateAiImage(imagePrompt, selectedRatio);
      setGeneratedImageUrl(url);
    } catch (error: any) {
      if (error.message === "KEY_RESET") {
        setShowKeyPrompt(true);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !generatedImageUrl) return;

    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setShowKeyPrompt(true);
      return;
    }

    setIsEditingImage(true);
    try {
      const url = await editAiImage(generatedImageUrl, editPrompt);
      setGeneratedImageUrl(url);
      setEditPrompt('');
    } catch (error: any) {
      if (error.message === "KEY_RESET") {
        setShowKeyPrompt(true);
      }
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setShowKeyPrompt(false);
    if (activeStudioTab === 'generate') {
      handleGenerateImage();
    } else {
      handleEditImage();
    }
  };

  const openChat = () => {
    if (!chatSessionRef.current) chatSessionRef.current = createChatSession();
    setIsChatOpen(true);
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetRoutineTimer = () => {
    setIsTimerActive(false);
    if (selectedRoutine) {
      const timed = selectedRoutine.exercises.filter(ex => parseDuration(ex) > 0);
      setCurrentStepIndex(selectedRoutine.exercises.indexOf(timed[0]));
      setCurrentRound(1);
      const duration = parseDuration(timed[0]);
      setTimeLeft(duration);
      setTotalStepTime(duration);
    }
  };

  const toggleRoutinesPage = (level?: Difficulty) => {
    if (level) setActiveTab(level);
    setIsRoutinesPageOpen(!isRoutinesPageOpen);
    setIsProgramPageOpen(false);
    window.scrollTo(0, 0);
  };

  const handleOpenProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsProgramPageOpen(true);
    setIsRoutinesPageOpen(false);
    window.scrollTo(0, 0);
  };

  const handleStartRoutineFromPlan = (routineId: string) => {
    const routine = ROUTINES.find(r => r.id === routineId);
    if (routine) {
      setSelectedRoutine(routine);
      setWorkoutFinished(false);
      resetRoutineTimer();
    }
  };

  // --- SHARED COMPONENTS ---

  const RoutinePlayerModal = () => {
    if (!selectedRoutine) return null;

    const currentExercise = selectedRoutine.exercises[currentStepIndex];
    const timedExercises = selectedRoutine.exercises.filter(ex => parseDuration(ex) > 0);
    const currentIndexInTimed = timedExercises.indexOf(currentExercise);
    const nextExercise = currentIndexInTimed < timedExercises.length - 1 
      ? timedExercises[currentIndexInTimed + 1] 
      : (currentRound < totalRounds ? timedExercises[0] : "¡Último paso!");

    const progressPercentage = totalStepTime > 0 ? (timeLeft / totalStepTime) * 100 : 0;

    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-indigo-950/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col border border-white/20">
          <button onClick={() => { setSelectedRoutine(null); setIsTimerActive(false); }} className="absolute top-8 right-8 p-3 bg-gray-100 rounded-2xl transition hover:bg-red-50 hover:text-red-500 z-10"><X className="w-8 h-8" /></button>
          
          <div className="p-8 md:p-12 overflow-y-auto">
            {!workoutFinished ? (
              <div className="flex flex-col h-full">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-indigo-950 mb-4 tracking-tighter leading-tight">{selectedRoutine.title}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100"><Clock className="w-3 h-3" /> {selectedRoutine.duration} TOTAL</span>
                      <span className="bg-amber-50 text-amber-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                        <RefreshCw className="w-3 h-3 animate-spin-slow" /> RONDA {currentRound} / {totalRounds}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MAIN TIMER SECTION */}
                <div className="relative mb-12 bg-indigo-950 rounded-[3.5rem] p-10 md:p-16 text-center shadow-2xl shadow-indigo-200 overflow-hidden group border border-white/10">
                  {/* Visual Background Progress */}
                  <div className="absolute inset-0 bg-indigo-900 opacity-20 pointer-events-none"></div>
                  <div 
                    className="absolute left-0 bottom-0 h-4 bg-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(52,211,153,0.5)]" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>

                  <div className="relative z-10">
                    <div className="text-[14px] font-black text-indigo-300 uppercase tracking-[0.6em] mb-6">TIEMPO RESTANTE</div>
                    <div className="text-[10rem] md:text-[14rem] font-black text-white tabular-nums tracking-tighter leading-none mb-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                      {formatTime(timeLeft)}
                    </div>

                    <div className="inline-flex flex-col items-center bg-white/10 backdrop-blur-xl px-12 py-8 rounded-[3rem] border border-white/20 mb-12 w-full max-w-2xl shadow-2xl">
                      <span className="text-emerald-400 font-black uppercase text-[12px] tracking-[0.4em] block mb-3">HACIENDO AHORA</span>
                      <p className="text-white font-black text-4xl md:text-5xl tracking-tight leading-tight">{currentExercise}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center items-center gap-10">
                      {!isTimerActive ? (
                        <button 
                          onClick={() => setIsTimerActive(true)} 
                          className="bg-emerald-500 text-white px-16 py-8 rounded-[2.5rem] font-black text-3xl hover:bg-emerald-600 transition shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] flex items-center gap-4 active:scale-95 group"
                        >
                          <Play className="w-10 h-10 fill-white group-hover:scale-110 transition-transform" /> EMPEZAR
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsTimerActive(false)} 
                          className="bg-amber-500 text-white px-16 py-8 rounded-[2.5rem] font-black text-3xl hover:bg-amber-600 transition shadow-[0_20px_40px_-10px_rgba(245,158,11,0.5)] flex items-center gap-4 active:scale-95 group"
                        >
                          <Pause className="w-10 h-10 fill-white group-hover:scale-110 transition-transform" /> PAUSAR
                        </button>
                      )}
                      <button 
                        onClick={resetRoutineTimer} 
                        className="bg-white/5 text-white border-2 border-white/10 px-10 py-8 rounded-[2.5rem] font-black hover:bg-white/20 transition active:scale-95"
                        title="Reiniciar paso"
                      >
                        <RotateCcw className="w-10 h-10" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* NEXT UP SECTION */}
                <div className="flex items-center gap-8 bg-indigo-50 p-10 rounded-[3rem] border-2 border-indigo-100 mb-12 shadow-sm">
                   <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-100">
                      <FastForward className="w-8 h-8 text-white" />
                   </div>
                   <div className="flex-1">
                      <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-2">PRÓXIMO PASO</span>
                      <p className="text-indigo-950 font-black text-2xl md:text-3xl tracking-tight">{nextExercise}</p>
                   </div>
                </div>

                {/* Step List Progress */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">LISTA DE PASOS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRoutine.exercises.map((ex, i) => {
                      const isActive = i === currentStepIndex;
                      const isDone = i < currentStepIndex;
                      const isTimed = parseDuration(ex) > 0;
                      if (!isTimed && !parseRounds(ex)) return null;

                      return (
                        <div key={i} className={`flex gap-4 items-center p-5 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-gray-50'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${isActive ? 'bg-white text-indigo-600' : isDone ? 'bg-indigo-100 text-indigo-500' : 'bg-gray-200 text-gray-400'}`}>
                            {isDone ? <Check className="w-5 h-5" /> : i + 1}
                          </div>
                          <p className={`text-base font-black truncate ${isActive ? 'text-white' : isDone ? 'text-indigo-200' : 'text-indigo-950'}`}>{ex}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 animate-in zoom-in-95 duration-700">
                <div className="w-48 h-48 bg-emerald-100 rounded-[4rem] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-emerald-50">
                  <Award className="w-24 h-24 text-emerald-600" />
                </div>
                <h2 className="text-6xl md:text-7xl font-black text-indigo-950 mb-8 tracking-tighter leading-tight">ENTRENAMIENTO<br /><span className="text-emerald-500">COMPLETADO</span></h2>
                <p className="text-xl text-gray-500 font-bold mb-14">¡Has dominado el ritmo hoy! Sigue así para ver resultados reales.</p>
                <button 
                  onClick={() => { setSelectedRoutine(null); setWorkoutFinished(false); }} 
                  className="bg-indigo-600 text-white px-20 py-8 rounded-[3rem] font-black text-3xl hover:bg-indigo-700 transition shadow-2xl active:scale-95"
                >
                  FINALIZAR SESIÓN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // VIEW: Library of Routines
  if (isRoutinesPageOpen) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-[150] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <button onClick={() => toggleRoutinesPage()} className="flex items-center gap-2 text-indigo-600 font-black hover:bg-indigo-50 px-4 py-2 rounded-xl transition"><ArrowLeft className="w-5 h-5" /> VOLVER</button>
              <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2 rounded-xl"><Zap className="text-white w-5 h-5" /></div><span className="text-xl font-black tracking-tighter text-indigo-950">BIBLIOTECA DE RUTINAS</span></div>
              <div className="w-24"></div>
            </div>
          </div>
        </nav>
        <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center"><h1 className="text-6xl font-black text-indigo-950 mb-6 tracking-tighter">Explora el Flow</h1><p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">20 rutinas diseñadas por expertos para llevar tu agilidad y cardio al siguiente nivel.</p></div>
          <div className="flex justify-center mb-16">
            <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-100 rounded-[2rem] shadow-inner">
              {[Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED, Difficulty.COMBOS].map((level) => (
                <button key={level} onClick={() => setActiveTab(level)} className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all whitespace-nowrap ${activeTab === level ? 'bg-white text-indigo-600 shadow-xl' : 'text-gray-500 hover:text-indigo-600'}`}>{level === Difficulty.COMBOS ? <span className="flex items-center gap-2"><Music className="w-4 h-4" /> {level}</span> : level}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {ROUTINES.filter(r => r.difficulty === activeTab).map(routine => (
              <div key={routine.id} className="bg-white border border-gray-100 rounded-[3rem] p-10 hover:shadow-2xl transition-all flex flex-col h-full group relative overflow-hidden shadow-sm border-b-8 hover:border-indigo-600 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex justify-between items-start mb-8"><span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${activeTab === Difficulty.COMBOS ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>{routine.duration}</span>{activeTab === Difficulty.COMBOS ? <Music className="text-pink-400 w-7 h-7" /> : <Award className="text-indigo-400 w-7 h-7" />}</div>
                <h3 className="text-3xl font-black text-indigo-950 mb-4 leading-tight">{routine.title}</h3>
                <p className="text-gray-500 text-base mb-8 font-bold leading-relaxed italic h-12 overflow-hidden line-clamp-2">{routine.objective}</p>
                <div className="flex-grow space-y-4 mb-10">{routine.exercises.slice(0, 3).map((ex, i) => (<div key={i} className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${activeTab === Difficulty.COMBOS ? 'bg-pink-500' : 'bg-indigo-500'}`}></div><span className="text-gray-900 text-lg font-black tracking-tight">{ex}</span></div>))}</div>
                <button onClick={() => { setSelectedRoutine(routine); setWorkoutFinished(false); resetRoutineTimer(); }} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-sm flex items-center justify-center gap-3 ${activeTab === Difficulty.COMBOS ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'} hover:bg-indigo-600 hover:text-white`}>ENTRENAR <Play className="w-5 h-5 fill-current" /></button>
              </div>
            ))}
          </div>
        </main>
        <RoutinePlayerModal />
      </div>
    );
  }

  // VIEW: Program Daily Plan
  if (isProgramPageOpen && selectedProgram) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-[150] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <button onClick={() => setIsProgramPageOpen(false)} className="flex items-center gap-2 text-indigo-600 font-black hover:bg-indigo-50 px-4 py-2 rounded-xl transition"><ArrowLeft className="w-5 h-5" /> VOLVER</button>
              <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Calendar className="text-white w-5 h-5" /></div><span className="text-xl font-black tracking-tighter text-indigo-950 uppercase">{selectedProgram.name}</span></div>
              <div className="w-24"></div>
            </div>
          </div>
        </nav>
        <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-950 rounded-[3rem] p-12 md:p-20 text-white mb-16 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-10"><Target className="w-64 h-64" /></div>
             <div className="relative z-10 max-w-2xl">
                <span className="bg-indigo-500/30 border border-indigo-400/30 px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-8 inline-block">Plan de {selectedProgram.days} Días</span>
                <h1 className="text-5xl md:text-7xl font-black mb-8 leading-none tracking-tighter">{selectedProgram.name}</h1>
                <p className="text-xl text-indigo-100/70 font-medium mb-10 leading-relaxed">{selectedProgram.description}</p>
                <div className="flex gap-10">
                   <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">FRECUENCIA</p><p className="text-2xl font-black">{selectedProgram.frequency}</p></div>
                   <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">PROGRESO</p><p className="text-2xl font-black">0 / {selectedProgram.days}</p></div>
                </div>
             </div>
          </div>
          <h2 className="text-4xl font-black text-indigo-950 mb-12 tracking-tighter">Calendario Diario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {selectedProgram.schedule.map((dayPlan) => {
              const routine = ROUTINES.find(r => r.id === dayPlan.routineId);
              return (
                <div key={dayPlan.day} className={`bg-white rounded-[2rem] p-8 border-2 transition-all group flex flex-col ${dayPlan.type === 'workout' ? 'border-indigo-50 hover:border-indigo-200 shadow-sm' : 'border-gray-50 opacity-80'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl font-black text-gray-200 group-hover:text-indigo-100 transition-colors">#{dayPlan.day}</span>
                    {dayPlan.type === 'workout' ? <Activity className="w-6 h-6 text-indigo-400" /> : dayPlan.type === 'rest' ? <Coffee className="w-6 h-6 text-amber-400" /> : <Heart className="w-6 h-6 text-emerald-400" />}
                  </div>
                  <h4 className="text-xl font-black text-indigo-950 mb-3">{dayPlan.type === 'workout' ? routine?.title : dayPlan.type === 'rest' ? 'Descanso' : 'Recuperación'}</h4>
                  <p className="text-sm text-gray-500 font-bold mb-8 leading-relaxed line-clamp-3">{dayPlan.type === 'workout' ? routine?.objective : dayPlan.description}</p>
                  {dayPlan.type === 'workout' && routine && (
                    <button onClick={() => handleStartRoutineFromPlan(routine.id)} className="mt-auto w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">ENTRENAR <Play className="w-4 h-4 fill-current" /></button>
                  )}
                  {dayPlan.type !== 'workout' && <div className="mt-auto py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs text-center border border-gray-100">RECARGA ENERGÍA</div>}
                </div>
              );
            })}
          </div>
        </main>
        <RoutinePlayerModal />
      </div>
    );
  }

  // MAIN VIEW: Landing Page
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-[100] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200"><Zap className="text-white w-6 h-6" /></div>
              <span className="text-2xl font-black tracking-tighter text-indigo-950">FLOW FIT</span>
            </div>
            <div className="hidden md:flex space-x-10">
              <button onClick={() => setIsBenefitsModalOpen(true)} className="text-gray-600 hover:text-indigo-600 font-bold transition-colors">Beneficios</button>
              <button onClick={() => toggleRoutinesPage()} className="text-gray-600 hover:text-indigo-600 font-bold transition-colors">Rutinas</button>
              <button onClick={openChat} className="text-gray-600 hover:text-indigo-600 font-bold transition-colors">Coach IA</button>
            </div>
            <button onClick={() => toggleRoutinesPage()} className="bg-indigo-600 text-white px-7 py-3 rounded-full font-black text-sm hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-95 uppercase tracking-widest">
              Empezar Ahora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-indigo-50 text-indigo-700 px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-10 animate-fade-in">TU CAMINO HACIA EL DOMINIO TOTAL</div>
          <h1 className="text-7xl md:text-[10rem] font-black text-indigo-950 mb-10 leading-[0.8] tracking-tighter">Eleva tu <span className="text-indigo-600">ritmo.</span></h1>
          <p className="max-w-3xl mx-auto text-2xl text-gray-500 mb-16 font-medium leading-relaxed">Descubre por qué <span className="text-indigo-950 font-bold underline decoration-indigo-200 decoration-4">10 minutos</span> de salto equivalen a 30 de trote. Rutinas maestras para transformar tu cardio y agilidad.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button onClick={() => toggleRoutinesPage()} className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200 group">Ver Rutinas <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></button>
            <button onClick={() => setIsGeneratorOpen(true)} className="flex items-center justify-center gap-3 bg-white border-2 border-indigo-100 text-indigo-600 px-12 py-6 rounded-[2rem] font-black text-xl hover:border-indigo-200 transition group shadow-sm">Coach IA <Sparkles className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" /></button>
          </div>
        </div>
      </section>

      {/* Benefits Meta Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="bg-indigo-600 rounded-[3.5rem] p-14 text-white shadow-2xl">
                <h3 className="text-4xl font-black mb-12">Poder Metabólico</h3>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between font-bold text-xl uppercase tracking-widest"><span>Salto (10 min)</span><span>150 KCAL</span></div>
                    <div className="h-4 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white w-full"></div></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between font-bold text-xl uppercase tracking-widest opacity-60"><span>Trote (10 min)</span><span>100 KCAL</span></div>
                    <div className="h-4 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white/40 w-2/3"></div></div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-black text-indigo-950 mb-8 leading-tight">La eficiencia es el nuevo cardio.</h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">Boxeadores y atletas de élite no saltan solo por diversión; lo hacen porque es la forma más rápida de construir una resistencia inagotable.</p>
              <button onClick={() => setIsBenefitsModalOpen(true)} className="text-indigo-600 font-black text-lg border-b-4 border-indigo-100 hover:border-indigo-600 transition-all pb-1 flex items-center gap-2 uppercase tracking-wider">Explorar todos los beneficios <ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Routines Grid (Landing Preview) */}
      <section className="py-32 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="text-left">
              <h2 className="text-6xl font-black text-indigo-950 mb-6 tracking-tighter leading-none">Nuestros Niveles</h2>
              <p className="text-xl text-gray-500 font-medium">Desde el primer salto hasta combos rítmicos complejos.</p>
            </div>
            <button onClick={() => toggleRoutinesPage()} className="text-indigo-600 font-black text-xl flex items-center gap-3 hover:gap-5 transition-all bg-indigo-50 px-8 py-4 rounded-2xl">VER BIBLIOTECA COMPLETA <ChevronRight className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED, Difficulty.COMBOS].map((level) => {
              const previewRoutine = ROUTINES.find(r => r.difficulty === level);
              if (!previewRoutine) return null;
              return (
                <div key={level} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 hover:shadow-2xl transition-all flex flex-col h-full group relative overflow-hidden shadow-sm border-b-4 hover:border-indigo-600">
                  <div className="mb-8"><span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${level === Difficulty.COMBOS ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>{level}</span></div>
                  <h3 className="text-2xl font-black text-indigo-950 mb-4 leading-none">{previewRoutine.title}</h3>
                  <p className="text-gray-500 text-sm mb-8 font-bold leading-relaxed italic line-clamp-2">{previewRoutine.objective}</p>
                  <button onClick={() => toggleRoutinesPage(level)} className="mt-auto w-full py-4 rounded-xl bg-gray-50 text-indigo-600 font-black text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">VER NIVEL <ChevronRight className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programas" className="py-32 bg-indigo-950 text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-6xl font-black mb-24 tracking-tighter">Programas Maestros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {PROGRAMS.map(prog => (
              <div key={prog.id} className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-14 border border-white/10 text-left hover:bg-white/10 transition-all group flex flex-col h-full shadow-2xl">
                <div className="bg-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform"><Target className="w-8 h-8" /></div>
                <h3 className="text-3xl font-black mb-6 leading-tight">{prog.name}</h3>
                <p className="text-indigo-100/70 mb-12 font-medium text-lg leading-relaxed">{prog.description}</p>
                <div className="mt-auto flex justify-between items-center pt-10 border-t border-white/10">
                  <span className="font-black text-sm tracking-widest uppercase">{prog.days} DÍAS</span>
                  <button onClick={() => handleOpenProgram(prog)} className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition active:scale-95 flex items-center gap-2">VER PLAN <ExternalLink className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technique Section */}
      <section className="py-32 bg-white scroll-mt-20" id="tecnica">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-black text-indigo-950 mb-12 leading-tight">Domina el Flow técnico.</h2>
            <div className="space-y-10 text-left">
              {[{ q: 'Las Muñecas son la clave', a: 'El movimiento circular viene solo de las muñecas. Los codos deben permanecer pegados a las costillas en todo momento.' }, { q: 'Aterrizaje suave', a: 'Nunca aterrices con los talones. Debes mantenerte siempre sobre la parte delantera de los pies para proteger tus articulaciones.' }].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="bg-amber-50 p-5 rounded-2xl h-fit group-hover:scale-110 transition-transform shadow-sm"><AlertCircle className="w-8 h-8 text-amber-600" /></div>
                  <div><h4 className="text-2xl font-black text-indigo-950 mb-3">{item.q}</h4><p className="text-gray-600 text-lg font-medium leading-relaxed">{item.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section id="equipo" className="py-32 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <h2 className="text-5xl font-black text-indigo-950 mb-20 tracking-tighter">Tu Equipo de Poder</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {EQUIPMENTS.map((eq, i) => (
               <div key={i} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-gray-100 flex flex-col h-full group">
                  <div className="h-64 overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-900/5 group-hover:bg-transparent transition-colors"></div>
                    <img src={eq.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={eq.name} />
                  </div>
                  <div className="p-12 flex-grow flex flex-col">
                    <span className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 block">{eq.type}</span>
                    <h3 className="text-3xl font-black text-indigo-950 mb-6">{eq.name}</h3>
                    <p className="text-gray-500 text-lg font-medium mb-10 leading-relaxed line-clamp-2">{eq.description}</p>
                    <div className="mt-auto bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-2">IDEAL PARA:</p>
                      <p className="font-black text-indigo-950 text-xl">{eq.bestFor}</p>
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center border-b border-white/10 pb-20">
            <div>
              <div className="flex items-center gap-3 mb-10"><div className="bg-indigo-600 p-2 rounded-xl"><Zap className="w-8 h-8" /></div><span className="text-4xl font-black tracking-tighter">FLOW FIT</span></div>
              <p className="text-2xl text-indigo-100/70 font-medium leading-relaxed max-w-xl">Transformamos vidas a través del ritmo. Únete a la comunidad de salto más grande del mundo.</p>
            </div>
            <div className="flex gap-12 md:justify-end text-xl font-black">
              <a href="#" className="hover:text-indigo-400 transition">TikTok</a>
              <a href="#" className="hover:text-indigo-400 transition">Instagram</a>
              <a href="#" className="hover:text-indigo-400 transition">YouTube</a>
            </div>
          </div>
          <p className="pt-16 text-center text-indigo-200/40 font-bold uppercase tracking-widest text-sm">© 2024 Flow Fit Mastery. El ritmo es tu superpoder.</p>
        </div>
      </footer>

      {/* MODALS */}

      <RoutinePlayerModal />

      {/* Benefits Detailed Modal */}
      {isBenefitsModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-indigo-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsBenefitsModalOpen(false)} className="absolute top-8 right-8 p-3 bg-gray-100 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"><X className="w-8 h-8" /></button>
            <div className="p-12 md:p-20 overflow-y-auto">
               <h2 className="text-6xl font-black text-indigo-950 mb-14 tracking-tighter text-center">Beneficios de Élite</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[
                  { icon: Heart, color: 'bg-rose-50 text-rose-600', title: 'Cardio Supremo', desc: 'Fortalece el corazón como ningún otro ejercicio de bajo impacto.' },
                  { icon: ZapIcon, color: 'bg-amber-50 text-amber-600', title: 'Grasa Off', desc: 'Quema calórica masiva que continúa horas después de terminar.' },
                  { icon: Target, color: 'bg-indigo-50 text-indigo-600', title: 'Coordinación', desc: 'Sincroniza hemisferios cerebrales con cada vuelta de cuerda.' },
                  { icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', title: 'Huesos Fuertes', desc: 'El impacto controlado mejora dramáticamente la densidad ósea.' },
                  { icon: Brain, color: 'bg-violet-50 text-violet-600', title: 'Foco Mental', desc: 'Requiere concentración total, actuando como meditación activa.' },
                  { icon: Award, color: 'bg-blue-50 text-blue-600', title: 'Fuerza Explosiva', desc: 'Desarrolla potencia en gemelos y tren inferior de forma natural.' }
                ].map((b, i) => (
                  <div key={i} className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all">
                    <div className={`${b.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}><b.icon className="w-9 h-9" /></div>
                    <h4 className="text-2xl font-black text-indigo-950 mb-4">{b.title}</h4>
                    <p className="text-gray-600 font-bold leading-relaxed">{b.desc}</p>
                  </div>
                ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Generator Modal Window */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-indigo-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsGeneratorOpen(false)} className="absolute top-8 right-8 p-3 bg-gray-100 rounded-2xl transition hover:bg-red-50 hover:text-red-500 z-50"><X className="w-8 h-8" /></button>
            <div className="flex flex-col lg:flex-row h-full">
              {/* Routine Generator */}
              <div className="lg:w-1/2 p-12 md:p-16 border-r border-gray-100 overflow-y-auto">
                  <div className="flex items-center gap-3 text-indigo-600 mb-6 font-black tracking-widest text-xs uppercase"><Cpu className="w-6 h-6" /> FLOW-GEN v3.0</div>
                  <h2 className="text-4xl font-black text-indigo-950 mb-10 tracking-tighter leading-none">Generador de Rutinas</h2>
                  <form onSubmit={handleGenerateAiRoutine} className="space-y-8">
                     <input type="text" placeholder="¿Cuál es tu meta hoy? (Ej: Dobles)" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 text-xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} required />
                     <div className="grid grid-cols-2 gap-6">
                        <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 text-xl font-bold appearance-none transition-all outline-none" value={aiLevel} onChange={(e) => setAiLevel(e.target.value)}><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select>
                        <div className="relative"><input type="number" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 text-xl font-bold outline-none" value={aiTime} onChange={(e) => setAiTime(e.target.value)} min="5" max="60" /><span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">MIN</span></div>
                     </div>
                     <button type="submit" disabled={loadingAi} className="w-full bg-indigo-600 text-white font-black py-7 rounded-[1.5rem] hover:bg-indigo-700 transition shadow-2xl text-xl flex items-center justify-center gap-4 active:scale-95">{loadingAi ? <RefreshCw className="animate-spin" /> : 'GENERAR RUTINA MAESTRA'}</button>
                  </form>
                  {customRoutine && (
                    <div className="mt-12 bg-gray-50/50 border-2 border-gray-100 rounded-[3rem] p-10 animate-in fade-in slide-in-from-bottom-6">
                      <div className="flex justify-between items-center mb-10 border-b-2 border-indigo-100 pb-8"><h3 className="text-3xl font-black text-indigo-600 leading-none">{customRoutine.title}</h3><button onClick={() => { navigator.clipboard.writeText(customRoutine.title); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-3 bg-white rounded-xl shadow-sm text-gray-400 hover:text-indigo-600 transition">{copied ? <Check className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}</button></div>
                      <div className="space-y-6 mb-12">{customRoutine.mainSet.map((step: string, i: number) => (<div key={i} className="flex gap-6 items-start text-xl text-gray-800 font-black leading-tight"><span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 shadow-lg">{i+1}</span><span>{step}</span></div>))}</div>
                    </div>
                  )}
              </div>

              {/* Image Generator / Studio */}
              <div className="lg:w-1/2 p-12 md:p-16 bg-gray-50/50 overflow-y-auto">
                <div className="flex items-center gap-3 text-emerald-600 mb-6 font-black tracking-widest text-xs uppercase"><ImageIcon className="w-6 h-6" /> VISUAL STUDIO IA</div>
                
                {/* Tabs */}
                <div className="flex gap-4 mb-10 p-2 bg-white rounded-2xl shadow-sm">
                  <button 
                    onClick={() => setActiveStudioTab('generate')}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeStudioTab === 'generate' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    <Wand2 className="w-4 h-4" /> GENERAR
                  </button>
                  <button 
                    onClick={() => setActiveStudioTab('edit')}
                    disabled={!generatedImageUrl}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${!generatedImageUrl ? 'opacity-50 cursor-not-allowed' : ''} ${activeStudioTab === 'edit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    <Palette className="w-4 h-4" /> EDITAR
                  </button>
                </div>

                <div className="space-y-8">
                   {activeStudioTab === 'generate' ? (
                     <>
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">PROMPT MOTIVACIONAL</label>
                            <textarea placeholder="Describe la imagen fitness que deseas (ej: Salto en la playa al atardecer, estilo futurista...)" className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 text-lg font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none min-h-[120px]" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">RELACIÓN DE ASPECTO</label>
                            <div className="grid grid-cols-4 gap-3">
                              {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map((ratio) => (
                                <button key={ratio} onClick={() => setSelectedRatio(ratio)} className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${selectedRatio === ratio ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'}`}>
                                  {ratio}
                                </button>
                              ))}
                            </div>
                        </div>

                        <button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} className="w-full bg-emerald-600 text-white font-black py-7 rounded-[1.5rem] hover:bg-emerald-700 transition shadow-2xl text-xl flex items-center justify-center gap-4 active:scale-95">
                            {isGeneratingImage ? <RefreshCw className="animate-spin" /> : <><Sparkles className="w-6 h-6" /> GENERAR IMAGEN</>}
                        </button>
                     </>
                   ) : (
                     <>
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">EDITAR IMAGEN ACTUAL</label>
                            <textarea placeholder="¿Qué quieres cambiar? (ej: 'Agrega un filtro retro', 'quita a la persona del fondo', 'cambia el color de la cuerda a rojo')" className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] px-8 py-5 text-lg font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none min-h-[120px]" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                        </div>

                        <button onClick={handleEditImage} disabled={isEditingImage || !editPrompt.trim()} className="w-full bg-indigo-600 text-white font-black py-7 rounded-[1.5rem] hover:bg-indigo-700 transition shadow-2xl text-xl flex items-center justify-center gap-4 active:scale-95">
                            {isEditingImage ? <RefreshCw className="animate-spin" /> : <><Palette className="w-6 h-6" /> APLICAR EDICIÓN (NANO BANANA)</>}
                        </button>
                     </>
                   )}

                   {generatedImageUrl && (
                      <div className="mt-12 group relative">
                        <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
                          <img src={generatedImageUrl} alt="Generated motivation" className="w-full h-auto" />
                          {(isGeneratingImage || isEditingImage) && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                              <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <a href={generatedImageUrl} download="flowfit-motivation.png" className="p-4 bg-white/90 backdrop-blur-sm rounded-2xl text-indigo-950 shadow-xl hover:bg-white active:scale-90">
                            <Download className="w-6 h-6" />
                          </a>
                        </div>
                      </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Prompt Modal */}
      {showKeyPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-3xl font-black text-indigo-950 mb-4">Requiere API Key</h3>
            <p className="text-gray-500 font-medium mb-8">
              Para generar o editar imágenes de alta calidad, es necesario usar tu propia API Key con facturación activa.
            </p>
            <div className="space-y-4">
              <button onClick={handleOpenSelectKey} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition active:scale-95">
                SELECCIONAR API KEY
              </button>
              <button onClick={() => setShowKeyPrompt(false)} className="w-full bg-gray-50 text-gray-400 font-bold py-5 rounded-2xl hover:bg-gray-100 transition">
                CANCELAR
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block text-xs font-black text-indigo-400 uppercase tracking-widest hover:underline">
                MÁS INFORMACIÓN SOBRE FACTURACIÓN
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Bot */}
      {isChatOpen && (
        <div className="fixed bottom-10 right-10 z-[200] w-full max-w-md bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(79,70,229,0.4)] border border-indigo-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-20 duration-500">
          <div className="bg-indigo-600 p-8 flex justify-between items-center text-white"><div className="flex items-center gap-4"><div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20"><MessageSquare className="w-6 h-6" /></div><div><h3 className="font-black text-xl">FlowBot IA</h3><p className="text-xs text-indigo-100 font-bold flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Coach Activo</p></div></div><button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-3 rounded-2xl transition"><X className="w-7 h-7" /></button></div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[450px] bg-gray-50/50">
            {chatMessages.length === 0 && (<div className="text-center py-12"><div className="bg-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100"><Sparkles className="w-10 h-10 text-indigo-600" /></div><p className="text-gray-500 font-bold text-lg leading-relaxed px-6">Pregúntame sobre técnica, cuerdas o metas específicas.</p></div>)}
            {chatMessages.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-6 rounded-[2.5rem] font-bold text-lg leading-snug shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-indigo-950 rounded-tl-none border border-gray-100'}`}>{msg.text}</div></div>))}
            {isChatLoading && (<div className="flex justify-start"><div className="bg-white p-6 rounded-[2.5rem] rounded-tl-none flex gap-2 border border-gray-100 shadow-sm"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div></div></div>)}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChatMessage} className="p-6 bg-white border-t border-gray-100 flex gap-3">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none" />
            <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-indigo-600 text-white p-5 rounded-2xl hover:bg-indigo-700 transition shadow-xl active:scale-95"><Send className="w-6 h-6" /></button>
          </form>
        </div>
      )}

      {/* Floating Launcher */}
      {!isChatOpen && (
        <button onClick={openChat} className="fixed bottom-10 right-10 z-[190] bg-indigo-600 text-white p-7 rounded-[2.5rem] shadow-[0_30px_60px_-10px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <MessageSquare className="w-9 h-9 relative z-10" />
        </button>
      )}

    </div>
  );
};

export default App;
