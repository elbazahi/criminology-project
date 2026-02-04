
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  CheckCircle2, 
  Monitor,
  Mail,
  Phone,
  Info,
  Calendar,
  BookOpen,
  Target,
  Zap,
  Moon,
  Layout,
  Clock,
  Check,
  Trophy,
  Award,
  Star,
  RefreshCcw,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { INITIAL_EXAMS, QUIZ_BANK, DELINQUENCY_QUESTIONS } from './constants';
import { Difficulty, Question, Exam } from './types';

// Components
const StatCard = ({ label, value, subValue, subValueClass }: { label: string; value: string | number, subValue?: string, subValueClass?: string }) => (
  <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/40 dark:border-slate-700 min-h-[180px] flex flex-col justify-center items-center text-center transition-transform hover:scale-105 hover:shadow-2xl group">
    <div className="text-gray-400 dark:text-slate-500 text-xl font-black mb-3 uppercase tracking-wide group-hover:text-[#6c5ce7] transition-colors">{label}</div>
    <div className="text-6xl md:text-7xl font-black text-[#6c5ce7] dark:text-[#a29bfe] tracking-tight drop-shadow-sm">{value}</div>
    {subValue && <div className={`text-lg font-bold mt-3 ${subValueClass || ''}`}>{subValue}</div>}
  </div>
);

const App: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('tzachi_exams_v12.0_final');
    if (saved) return JSON.parse(saved);
    return INITIAL_EXAMS.map(e => ({ ...e, originalDate: e.date }));
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const timerRef = useRef<number | null>(null);
  const [lastQuizScore, setLastQuizScore] = useState<number>(() => parseInt(localStorage.getItem('last_quiz_score') || '0'));
  
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty | null>(null);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStep, setQuizStep] = useState<'name_entry' | 'selection' | 'play' | 'result'>('name_entry');
  const [answeredIdx, setAnsweredIdx] = useState<number | null>(null);
  const [quizUserName, setQuizUserName] = useState('');

  // --- Delinquency Quiz State (Persistent) ---
  const [isDelinquencyQuizOpen, setIsDelinquencyQuizOpen] = useState(false);
  
  // Initialize from LocalStorage or empty
  const [delinquencyQuestions, setDelinquencyQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('delinq_state_v1');
    return saved ? JSON.parse(saved).questions : [];
  });
  
  const [delinquencyIdx, setDelinquencyIdx] = useState(() => {
    const saved = localStorage.getItem('delinq_state_v1');
    return saved ? JSON.parse(saved).idx : 0;
  });

  const [delinquencyStats, setDelinquencyStats] = useState<{correct: number, incorrect: number}>(() => {
    const saved = localStorage.getItem('delinq_state_v1');
    return saved ? JSON.parse(saved).stats || { correct: 0, incorrect: 0 } : { correct: 0, incorrect: 0 };
  });

  const [delinquencySelectedAnswer, setDelinquencySelectedAnswer] = useState<number | null>(null);

  // Save Delinquency State on Change
  useEffect(() => {
    if (delinquencyQuestions.length > 0) {
      localStorage.setItem('delinq_state_v1', JSON.stringify({
        questions: delinquencyQuestions,
        idx: delinquencyIdx,
        stats: delinquencyStats
      }));
    }
  }, [delinquencyQuestions, delinquencyIdx, delinquencyStats]);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const [contactModal, setContactModal] = useState<{ isOpen: boolean; type: 'phone' | 'email' | 'calendar'; value: string; exam?: Exam }>({
    isOpen: false,
    type: 'phone',
    value: ''
  });

  const getDaysDiff = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 999;
    const [d, m, y] = parts.map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  useEffect(() => {
    localStorage.setItem('tzachi_exams_v12.0_final', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    if (isFocusMode) {
      timerRef.current = window.setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            alert("זמן המיקוד הסתיים! כל הכבוד ☕");
            setIsFocusMode(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isFocusMode]);

  const toggleFocus = () => { setFocusSeconds(25 * 60); setIsFocusMode(!isFocusMode); };
  const formatTimeMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeExams = exams.filter(e => e.status === 'active');
  const archivedExams = exams.filter(e => e.status === 'archive');
  const sortedActive = [...activeExams].sort((a, b) => getDaysDiff(a.date) - getDaysDiff(b.date));
  const progressPercent = Math.round(((exams.length - activeExams.length) / (exams.length || 1)) * 100);

  const startQuizWithDifficulty = (diff: Difficulty) => {
    const filtered = QUIZ_BANK.filter(q => q.lvl === diff);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 20);
    setCurrentQuizQuestions(shuffled);
    setQuizDifficulty(diff);
    setCurrentQuizIdx(0);
    setQuizScore(0);
    setAnsweredIdx(null);
    setQuizStep('play');
  };

  const nextQuestion = () => {
    if (currentQuizIdx < currentQuizQuestions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setAnsweredIdx(null);
    } else {
      const finalScore = Math.round((quizScore / currentQuizQuestions.length) * 100);
      setLastQuizScore(finalScore);
      localStorage.setItem('last_quiz_score', finalScore.toString());
      setQuizStep('result');
    }
  };

  // --- Delinquency Quiz Logic ---
  const generateShuffledQuestions = () => {
     const processedQuestions = DELINQUENCY_QUESTIONS.map(q => {
        const options = q.a.map((opt, i) => ({
            text: opt,
            isCorrect: i === q.correct
        }));
        
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            ...q,
            a: options.map(o => o.text),
            correct: options.findIndex(o => o.isCorrect)
        };
     });
     
     // Shuffle the questions themselves
     return processedQuestions.sort(() => 0.5 - Math.random());
  };

  const startDelinquencyQuiz = () => {
    // If we have questions saved, just resume
    if (delinquencyQuestions.length > 0) {
        setIsDelinquencyQuizOpen(true);
        setDelinquencySelectedAnswer(null);
        return;
    }

    // Otherwise, generate new ones
    const questions = generateShuffledQuestions();
    setDelinquencyQuestions(questions);
    setDelinquencyIdx(0);
    setDelinquencySelectedAnswer(null);
    setIsDelinquencyQuizOpen(true);
  };

  const resetDelinquencyQuiz = () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את ההתקדמות ולהתחיל מחדש?")) {
        const questions = generateShuffledQuestions();
        setDelinquencyQuestions(questions);
        setDelinquencyIdx(0);
        setDelinquencySelectedAnswer(null);
        setDelinquencyStats({ correct: 0, incorrect: 0 });
    }
  };

  const nextDelinquencyQuestion = () => {
    if (delinquencyIdx < delinquencyQuestions.length - 1) {
       setDelinquencyIdx(prev => prev + 1);
       setDelinquencySelectedAnswer(null);
    } else {
       alert("סיימת את כל השאלות! כל הכבוד! 🏆");
       setIsDelinquencyQuizOpen(false);
       // Optional: Reset on finish
       setDelinquencyIdx(0);
    }
  };

  const toggleStatus = (id: number) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'archive' : 'active' } : e));
  };

  const returnToMoedA = (id: number) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'active', date: e.originalDate || e.date } : e));
  };

  const handleWhatsAppShare = () => {
    const text = `היי, מצורף לינק לאתר ניהול המטלות לקרימינולוגיה:\nhttps://sensational-babka-0a548f.netlify.app/\n\nבהצלחה בלימודים!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('הועתק ללוח! 📋');
  };

  const createGoogleCalendarUrl = (exam: Exam) => {
    const parts = exam.date.split('/');
    if (parts.length !== 3) return '#';
    const [d, m, y] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, '').split('T')[0];
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1);
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '').split('T')[0];
    const details = `מרצה: ${exam.lecturer}\nמייל: ${exam.email}\nדגשים: ${exam.adminNote.replace(/\n/g, ' ')}`;
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(exam.subject)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(details)}`;
  };

  const quizResultPercentage = Math.round((quizScore / (currentQuizQuestions.length || 1)) * 100);

  const renderSubjectWithGlint = (subject: string) => {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50\u2B55]|[\u2190-\u21FF]/g;
    const parts = subject.split(emojiRegex);
    const matches = subject.match(emojiRegex);
    
    return (
      <>
        <span className="text-glint-continuous">{parts[0]}</span>
        {matches && matches.map((m, i) => <span key={i}>{m}</span>)}
        {parts.length > 1 && <span className="text-glint-continuous">{parts.slice(1).join('')}</span>}
      </>
    );
  };
  
  const getDifficultyLabel = (lvl: Difficulty | null) => {
    if (lvl === Difficulty.EASY) return 'קלה';
    if (lvl === Difficulty.MEDIUM) return 'בינונית';
    if (lvl === Difficulty.HARD) return 'קשה';
    return '';
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0a0f1d] text-slate-100' : 'bg-[#f0f2f5] text-gray-800'} min-h-screen transition-colors duration-500 relative flex flex-col`}>
      
      {isFocusMode && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="text-[10rem] md:text-[15rem] font-black text-[#6c5ce7] leading-none mb-10 drop-shadow-2xl tabular-nums">{formatTimeMinutes(focusSeconds)}</div>
          <button onClick={toggleFocus} className="bg-red-500 hover:bg-red-600 text-white px-10 py-5 rounded-2xl text-2xl font-black transition-all hover:scale-105 shadow-xl">צא ממצב מיקוד ❌</button>
        </div>
      )}

      <div className={`max-w-6xl mx-auto px-4 py-8 flex-grow w-full ${isFocusMode ? 'hidden' : ''}`}>
        
        <header className="flex flex-col items-center mb-10 text-center w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-[#6c5ce7] to-[#00b894] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-[#6c5ce7]/30 mb-4 animate-pulse-glow cursor-pointer transition-transform hover:rotate-6 border-4 border-white/20">
            <span className="text-5xl drop-shadow-xl">🦉</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 w-full text-center mt-2">
            <span className="text-glint-continuous text-[#6c5ce7] dark:text-[#a29bfe]">מערכת ניהול משימות - קרימינולוגיה</span>
          </h1>
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center w-full max-w-4xl">
            <button className="w-full md:w-auto bg-gradient-to-br from-[#6c5ce7] via-[#8271ff] to-[#a29bfe] text-white px-6 py-3 md:px-10 md:py-4 rounded-2xl font-black text-xl md:text-2xl shadow-[0_10px_20px_-5px_rgba(108,92,231,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(108,92,231,0.6)] hover:scale-105 active:scale-95 border border-white/20 transition-all duration-300">
              סמסטר א' 🎓
            </button>
            <div className="flex gap-3 w-full md:w-auto">
              <button disabled className="flex-1 md:flex-none bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 px-4 py-3 md:px-8 rounded-2xl font-black text-lg md:text-2xl cursor-not-allowed border border-transparent shadow-inner whitespace-nowrap">
                סמסטר ב' 🎓
              </button>
              <button disabled className="flex-1 md:flex-none bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 px-4 py-3 md:px-8 rounded-2xl font-black text-lg md:text-2xl cursor-not-allowed border border-transparent shadow-inner whitespace-nowrap">
                סמסטר קיץ 🎓
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
          <StatCard label="🎯 היעד הבא" value={sortedActive.length > 0 ? sortedActive[0].subject.replace('💻', '').trim() : 'סיימנו!'} subValue={sortedActive.length > 0 ? `בעוד ${getDaysDiff(sortedActive[0].date)} ימים` : undefined} subValueClass={sortedActive.length > 0 && getDaysDiff(sortedActive[0].date) <= 5 ? 'text-red-500 animate-blink-red' : 'text-green-500'} />
          <StatCard label="📚 משימות פעילות" value={activeExams.length} />
          <StatCard label="🚀 אחוז ביצוע" value={`${progressPercent}%`} />
        </div>

        <div className="w-full bg-gray-200 dark:bg-slate-800 h-6 rounded-full overflow-hidden mb-12 shadow-inner p-1">
          <div className="h-full rounded-full transition-all duration-1000 animate-shimmer shadow-[0_0_15px_rgba(108,92,231,0.5)]" style={{ width: `${progressPercent}%` }} />
        </div>

        <section className="mb-16 flex flex-col items-center w-full">
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 justify-center w-full text-gray-800 dark:text-slate-200"><span className="text-[#6c5ce7] dark:text-[#a29bfe]">📋</span> משימות נוכחיות</h2>
          <div className="grid grid-cols-1 gap-8 text-center max-w-4xl w-full">
            {sortedActive.map(exam => {
              const diff = getDaysDiff(exam.date);
              const isUrgent = diff <= 5;
              const hasContent = (exam.link && exam.link !== '#') || (exam.adminNote && exam.adminNote.length > 50);
              const isBlueScreen = exam.subject.includes('💻');
              const displaySubject = exam.subject.replace('💻', '').trim();

              return (
                <div key={exam.id} className="relative bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border-2 border-white/50 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-[0_20px_40px_-10px_rgba(108,92,231,0.2)] transition-all duration-300 overflow-hidden">
                  {/* Decorative side bar */}
                  <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${isBlueScreen ? 'from-blue-500 via-cyan-400 to-blue-500' : 'from-[#6c5ce7] via-[#a29bfe] to-[#6c5ce7]'}`} />
                  
                  {/* Blue Screen Effect */}
                  {isBlueScreen && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />}

                  <div className="flex-1 text-center md:text-right z-10 w-full">
                    <h3 className={`text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-4 ${isUrgent ? 'text-red-500' : 'text-gray-800 dark:text-slate-100'}`}>
                      {renderSubjectWithGlint(displaySubject)}
                      {isBlueScreen && (
                        <div className="relative group/monitor">
                            <Monitor className="w-8 h-8 text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" />
                            <div className="absolute inset-0 bg-blue-400/30 blur-lg rounded-full" />
                        </div>
                      )}
                    </h3>
                    <p className="text-gray-500 dark:text-slate-400 text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                        <span>👨‍🏫</span>
                        {exam.lecturer}
                    </p>
                    
                    <div className="flex gap-4 mt-6 justify-center md:justify-start">
                      {exam.phone && <button onClick={() => setContactModal({ isOpen: true, type: 'phone', value: exam.phone! })} className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all border border-green-100 dark:border-green-800 shadow-sm">📞</button>}
                      <button onClick={() => setContactModal({ isOpen: true, type: 'email', value: exam.email })} className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all border border-blue-100 dark:border-blue-800 shadow-sm">✉️</button>
                      <button onClick={() => setContactModal({ isOpen: true, type: 'calendar', value: '', exam: exam })} className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all border border-indigo-100 dark:border-indigo-800 shadow-sm">📅</button>
                    </div>
                  </div>

                  <div className="text-center px-6 py-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 min-w-[140px]">
                     <div className="text-2xl font-black tabular-nums text-gray-800 dark:text-slate-100">{exam.date}</div>
                     <div className={`text-base font-bold mt-1 ${isUrgent ? 'text-red-500 animate-blink-red' : 'text-green-600'}`}>בעוד {diff} ימים</div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-auto items-center min-w-[200px]">
                    <button 
                      onClick={() => { if(hasContent) { setSelectedExam(exam); setIsInfoModalOpen(true); } }} 
                      disabled={!hasContent} 
                      className={`${hasContent ? 'bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] text-white shadow-purple-500/30' : 'bg-gray-200 dark:bg-slate-700 text-gray-400 opacity-60'} p-4 rounded-2xl font-black text-sm transition-all w-full shadow-lg active:scale-95 hover:rotate-1 hover:scale-105 border-2 border-white/20`}
                    >
                      חומרים ודגשים ✨
                    </button>
                    {exam.id === 1 && (
                      <button 
                        onClick={() => setIsQuizModalOpen(true)} 
                        className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white p-4 rounded-2xl font-black text-[12px] shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 hover:rotate-1 active:scale-95 transition-all w-full border-2 border-white/20 tracking-wide"
                      >
                        תרגול למבחן ✍️
                      </button>
                    )}
                    {exam.id === 2 && (
                        <div className="w-full relative group/practice">
                          {delinquencyIdx > 0 && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 whitespace-nowrap border border-white/20 shadow-md">
                              הושלמו: {delinquencyIdx} / {delinquencyQuestions.length > 0 ? delinquencyQuestions.length : DELINQUENCY_QUESTIONS.length}
                            </div>
                          )}
                          <button 
                            onClick={startDelinquencyQuiz} 
                            className="bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 text-white p-4 rounded-2xl font-black text-[12px] shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 hover:rotate-1 active:scale-95 transition-all border-2 border-white/20 uppercase tracking-wide w-full relative overflow-hidden"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                               <span>תרגול למבחן 🎯</span>
                            </span>
                            {delinquencyIdx > 0 && (
                                <div className="absolute bottom-0 left-0 h-1.5 bg-white/30 w-full">
                                   <div className="h-full bg-white/80 transition-all duration-500" style={{ width: `${(delinquencyIdx / (delinquencyQuestions.length || DELINQUENCY_QUESTIONS.length)) * 100}%` }} />
                                </div>
                            )}
                          </button>
                        </div>
                    )}
                    <button 
                        onClick={() => toggleStatus(exam.id)} 
                        className="w-full bg-gradient-to-br from-[#00b894] to-[#00cec9] text-white p-4 rounded-2xl font-black text-lg hover:scale-105 hover:rotate-1 shadow-lg shadow-teal-500/30 transition-all border-2 border-white/20 flex items-center justify-center gap-3 active:scale-95"
                      >
                        <span>סיימתי!</span>
                        <CheckCircle2 className="w-6 h-6" strokeWidth={3} />
                      </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {archivedExams.length > 0 && (
          <section className="mt-20 mb-10 text-center flex flex-col items-center w-full">
            {/* CLEAN HIGHTECH DIVIDER TITLE */}
            <div className="flex items-center gap-6 w-full max-w-4xl mb-12 opacity-90 hover:opacity-100 transition-opacity">
               <div className="h-[2px] bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent flex-1 rounded-full" />
               <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-wider whitespace-nowrap flex items-center gap-3">
                 <span>משימות שהושלמו</span>
                 <CheckCircle2 className="w-6 h-6 text-green-500" strokeWidth={3} />
               </h2>
               <div className="h-[2px] bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent flex-1 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-4xl w-full">
              {archivedExams.map(exam => {
                const isBlueScreen = exam.subject.includes('💻');
                return (
                  <div key={exam.id} className="relative bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 border-white/30 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                    {/* Subtle completed overlay */}
                    <div className="absolute inset-0 bg-gray-100/10 dark:bg-black/10 pointer-events-none" />
                    
                    <div className="flex-1 text-center md:text-right z-10 w-full">
                      <h4 className="font-black text-2xl text-gray-700 dark:text-slate-300 flex items-center justify-center md:justify-start gap-3 opacity-90">
                        {isBlueScreen ? (
                          <Monitor className="w-6 h-6 text-blue-400" />
                        ) : (
                          <Sparkles className="w-7 h-7 text-yellow-400 animate-pulse" />
                        )}
                        {renderSubjectWithGlint(exam.subject.replace('💻','').trim())}
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-400 font-black mt-2 flex items-center justify-center md:justify-start gap-1">
                        <Check className="w-4 h-4" />
                        המשימה הושלמה בתאריך: {exam.date}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto items-center min-w-[200px] z-10">
                      <button 
                        onClick={() => returnToMoedA(exam.id)} 
                        className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center gap-2"
                      >
                        <span>חזרה למשימות</span>
                        <RefreshCcw className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-16 bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border-2 border-[#6c5ce7]/20 shadow-xl max-w-2xl mx-auto text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Gmail SVG Logo with Text */}
           <div className="flex flex-col items-center mb-6 group">
             <div className="w-20 h-20 drop-shadow-xl group-hover:scale-110 transition-transform duration-300">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-red-500 dark:text-red-400">
                 <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" fill="none"/>
                 <polyline points="22,6 12,13 2,6" stroke="currentColor" fill="none"/>
               </svg>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-center mt-2 text-gray-400 dark:text-slate-500 group-hover:text-red-500 transition-colors">GMAIL</span>
           </div>
           
           <h3 className="text-2xl font-black mb-2 text-gray-800 dark:text-slate-100">שלח את האתר לחברים</h3>
           <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-bold">הכנס כתובת אימייל ושלח את הלינק לסיכומים ולסימולטור</p>
           <div className="flex flex-col md:flex-row gap-4 w-full items-center justify-center">
             <input 
               type="email" 
               placeholder="example@gmail.com" 
               className="w-full md:w-auto flex-1 p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 font-bold text-center outline-none focus:border-[#6c5ce7] dark:text-white transition-all shadow-inner focus:shadow-lg focus:shadow-purple-500/10"
               value={shareEmail}
               onChange={(e) => setShareEmail(e.target.value)}
             />
             <button 
               onClick={() => { if(shareEmail) window.location.href=`mailto:${shareEmail}?subject=אתר ניהול מטלות קרימינולוגיה&body=היי, הנה הלינק לאתר המשימות, הסיכומים והסימולטור של צחי:\nhttps://sensational-babka-0a548f.netlify.app/`; }}
               className="w-full md:w-auto bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all border border-white/20"
             >
               שלח עכשיו 🚀
             </button>
           </div>
        </section>

        <div className="flex flex-wrap justify-center gap-12 py-16 mt-10 text-center">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 hover:-rotate-3 active:scale-95 p-4"
          >
            <div className="text-5xl filter drop-shadow-md group-hover:drop-shadow-[0_0_25px_rgba(250,204,21,0.8)] transition-all">{isDarkMode ? '🌞' : '🌙'}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400 dark:text-slate-500 group-hover:text-yellow-500 transition-colors">מצב {isDarkMode ? 'יום' : 'לילה'}</span>
          </button>
          
          <button 
            onClick={toggleFocus} 
            className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 hover:rotate-3 active:scale-95 p-4"
          >
            <div className="text-5xl filter drop-shadow-md group-hover:drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] transition-all">🎯</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400 dark:text-slate-500 group-hover:text-red-500 transition-colors">מיקוד</span>
          </button>
          
          <button 
            onClick={() => setIsGuideModalOpen(true)} 
            className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 hover:-rotate-3 active:scale-95 p-4"
          >
            <div className="text-5xl filter drop-shadow-md group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] transition-all">📖</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">מדריך</span>
          </button>
          
          <button 
            onClick={handleWhatsAppShare} 
            className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 hover:rotate-3 active:scale-95 p-4"
          >
             <svg viewBox="0 0 24 24" className="w-12 h-12 fill-green-500 dark:fill-green-400 filter drop-shadow-md group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)] transition-all"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.014 12.032c0 2.12.556 4.188 1.613 6.007L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.032-5.396 12.036-12.032a11.782 11.782 0 00-3.411-8.505z"/></svg>
             <span className="text-[10px] font-black uppercase tracking-widest text-center mt-1 text-gray-400 dark:text-slate-500 group-hover:text-green-500 transition-colors">וואצאפ</span>
          </button>
        </div>
      </div>

      {/* DELINQUENCY QUIZ SIMULATOR MODAL */}
      {isDelinquencyQuizOpen && delinquencyQuestions.length > 0 && (
          <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative border-4 border-orange-500 flex flex-col h-[90vh] md:h-auto">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                      <button onClick={() => setIsDelinquencyQuizOpen(false)} className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xl text-gray-500 hover:text-red-500 transition-colors">✕</button>
                      
                      <div className="flex gap-4 items-center">
                          <button 
                            onClick={resetDelinquencyQuiz}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-full font-bold text-xs hover:bg-gray-200 hover:text-red-500 transition-colors"
                            title="התחל מחדש (ערבוב שאלות)"
                          >
                             <RotateCcw className="w-4 h-4" />
                             <span>התחל מחדש</span>
                          </button>
                          <div className="text-right">
                              <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">תרגול למבחן</h2>
                              <p className="text-xs text-orange-500 font-bold">סימולטור 100 שאלות</p>
                          </div>
                      </div>
                  </div>

                  {/* External Progress Bar (Text + Visual) */}
                  <div className="mb-4">
                      <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-slate-400 mb-2">
                          <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">שאלה {delinquencyIdx + 1} / {delinquencyQuestions.length}</span>
                          <span>{Math.round(((delinquencyIdx + 1) / delinquencyQuestions.length) * 100)}%</span>
                      </div>
                      <div className="w-full h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 transition-all duration-500 relative" style={{ width: `${((delinquencyIdx + 1) / delinquencyQuestions.length) * 100}%` }}>
                              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex justify-center gap-4 mb-6">
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-800/30 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div className="flex flex-col items-center">
                              <span className="text-xs text-green-700 dark:text-green-300 font-bold uppercase">נכון</span>
                              <span className="text-lg font-black text-green-600 dark:text-green-400 leading-none">{delinquencyStats.correct}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-800/30 shadow-sm">
                          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-500 font-bold text-xs">✕</div>
                          <div className="flex flex-col items-center">
                              <span className="text-xs text-red-700 dark:text-red-300 font-bold uppercase">שגוי</span>
                              <span className="text-lg font-black text-red-600 dark:text-red-400 leading-none">{delinquencyStats.incorrect}</span>
                          </div>
                      </div>
                  </div>

                  {/* Question Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                      <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-slate-100 mb-8 leading-relaxed text-right">
                          {delinquencyQuestions[delinquencyIdx].q}
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                          {delinquencyQuestions[delinquencyIdx].a.map((opt, i) => {
                              const isSelected = delinquencySelectedAnswer === i;
                              const isCorrect = i === delinquencyQuestions[delinquencyIdx].correct;
                              const showFeedback = delinquencySelectedAnswer !== null;
                              
                              let btnClass = "w-full p-5 rounded-2xl text-right font-bold text-lg border-2 transition-all duration-200 ";
                              
                              if (!showFeedback) {
                                  btnClass += "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 text-gray-700 dark:text-slate-200";
                              } else {
                                  if (isCorrect) {
                                      btnClass += "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 shadow-md transform scale-[1.01]";
                                  } else if (isSelected && !isCorrect) {
                                      btnClass += "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300 opacity-60";
                                  } else {
                                      btnClass += "bg-gray-50 dark:bg-slate-800/50 border-transparent text-gray-400 opacity-50";
                                  }
                              }

                              return (
                                  <button 
                                      key={i}
                                      disabled={showFeedback}
                                      onClick={() => {
                                          setDelinquencySelectedAnswer(i);
                                          const isAnsCorrect = i === delinquencyQuestions[delinquencyIdx].correct;
                                          setDelinquencyStats(prev => ({
                                              correct: prev.correct + (isAnsCorrect ? 1 : 0),
                                              incorrect: prev.incorrect + (isAnsCorrect ? 0 : 1)
                                          }));
                                      }}
                                      className={btnClass}
                                  >
                                      {opt}
                                      {showFeedback && isCorrect && <span className="float-left text-2xl">✅</span>}
                                      {showFeedback && isSelected && !isCorrect && <span className="float-left text-2xl">❌</span>}
                                  </button>
                              );
                          })}
                      </div>

                      {/* Explanation & Next Button */}
                      {delinquencySelectedAnswer !== null && (
                          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <div className={`p-6 rounded-2xl border-r-4 shadow-sm mb-6 ${delinquencySelectedAnswer === delinquencyQuestions[delinquencyIdx].correct ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : 'bg-red-50 dark:bg-red-900/10 border-red-500'}`}>
                                  <h4 className="font-black text-sm uppercase tracking-wider mb-2 opacity-70 dark:text-slate-300">
                                      {delinquencySelectedAnswer === delinquencyQuestions[delinquencyIdx].correct ? 'כל הכבוד! הסבר:' : 'לא נורא, הנה ההסבר:'}
                                  </h4>
                                  <p className="text-gray-800 dark:text-slate-200 leading-relaxed font-medium">
                                      {delinquencyQuestions[delinquencyIdx].exp}
                                  </p>
                              </div>
                              <button 
                                  onClick={nextDelinquencyQuestion}
                                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                              >
                                  לשאלה הבאה ➔
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Extended Guide Modal */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 text-right">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative border-2 border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col transition-all duration-300">
            <button onClick={() => setIsGuideModalOpen(false)} className="absolute top-6 left-6 text-3xl opacity-30 hover:opacity-100 text-gray-500 hover:scale-110 transition-all">✕</button>
            <div className="text-center mb-10 w-full flex flex-col items-center">
               <h2 className="text-3xl font-black text-[#6c5ce7] dark:text-[#a29bfe] border-b-4 border-[#6c5ce7]/20 pb-4 inline-block mt-8">מדריך שימוש מורחב v12.0</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">ניהול משימות</span>
                    <Layout className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">כל המטלות מסודרות לפי תאריכים. משימות קרובות (פחות מ-5 ימים) יזהרו באדום כדי שלא תפספסו!</p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">חומרים ודגשים</span>
                    <BookOpen className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">לחיצה על "חומרים ודגשים" תפתח לכם את כל הקישורים לסיכומים, תמלולים והערות חשובות מהמרצה.</p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">סימולטור מבחן</span>
                    <Zap className="w-6 h-6 text-yellow-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">מאגר של 100 שאלות לתרגול אופטימלי. בכל פעם תקבלו 20 שאלות אקראיות ברמה שבחרתם.</p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">מצב מיקוד</span>
                    <Target className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">טיימר פומודורו (25 דקות) שיעזור לכם ללמוד בריכוז מקסימלי ללא הסחות דעת.</p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">סנכרון ליומן</span>
                    <Calendar className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">בלחיצה על האייקון הכחול ליד המשימה, תוכלו להוסיף את מועד המבחן ישירות ליומן גוגל שלכם.</p>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3 justify-end">
                    <span className="font-black text-lg text-gray-800 dark:text-slate-100">מצב לילה</span>
                    <Moon className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-bold">לומדים עד מאוחר? עברו למצב לילה כדי להגן על העיניים שלכם ולהמשיך לחרוש בסטייל.</p>
               </div>
            </div>

            <button onClick={() => setIsGuideModalOpen(false)} className="mt-10 w-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white py-5 rounded-[2rem] font-black text-xl hover:scale-[1.02] shadow-xl hover:shadow-purple-500/40 transition-all">הבנתי, בוא נתחיל! 🚀</button>
            <div className="text-center mt-6 text-xs text-gray-400 font-bold">מערכת חכמה לסטודנטים בקרימינולוגיה</div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative border-4 border-[#6c5ce7] transition-colors overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-6 w-full relative h-10">
               <button 
                  onClick={() => { setIsQuizModalOpen(false); setQuizStep('name_entry'); setQuizUserName(''); }} 
                  className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl opacity-50 hover:opacity-100 text-gray-500 z-30 transition-all border border-gray-200 dark:border-slate-700"
               >
                 ✕
               </button>
               {quizStep !== 'name_entry' && (
                 <div className="flex flex-col items-end text-right">
                    <span className="text-gray-500 dark:text-slate-400 font-black text-sm">נבחן: {quizUserName}</span>
                    {quizDifficulty && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white mt-1 ${quizDifficulty === 1 ? 'bg-green-500' : quizDifficulty === 2 ? 'bg-blue-500' : 'bg-red-500'}`}>
                        רמה {getDifficultyLabel(quizDifficulty)}
                      </span>
                    )}
                 </div>
               )}
            </div>
            
            {quizStep === 'name_entry' && (
              <div className="text-center py-10">
                <div className="text-6xl mb-6">📝</div>
                <h2 className="text-3xl font-black mb-4 text-[#6c5ce7] dark:text-[#a29bfe]">איך קוראים לך?</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-8 font-bold">השם שלך יופיע בסיום השאלון</p>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="הכנס שם כאן..."
                  className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 font-black text-center text-xl mb-8 outline-none focus:border-[#6c5ce7] transition-all dark:text-white shadow-inner"
                  value={quizUserName}
                  onChange={(e) => setQuizUserName(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && quizUserName.trim()) setQuizStep('selection'); }}
                />
                <button 
                  disabled={!quizUserName.trim()}
                  onClick={() => setQuizStep('selection')}
                  className="w-full bg-[#6c5ce7] text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  המשך לבחירת רמה ➔
                </button>
              </div>
            )}

            {quizStep === 'selection' && (
              <div className="text-center py-4">
                <div className="mb-4 text-xl font-black text-gray-500 dark:text-slate-400">שלום, {quizUserName}! 👋</div>
                <h2 className="text-3xl font-black mb-2 text-[#6c5ce7] dark:text-[#a29bfe]">בחר רמת קושי ✍️</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 font-bold">השאלון מכיל 20 שאלות אקראיות מתוך המאגר</p>
                <div className="flex flex-col gap-4 mt-4">
                  <button onClick={() => startQuizWithDifficulty(Difficulty.EASY)} className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 flex items-center justify-between">
                    <span>🟢 רמה קלה</span>
                    <span className="text-xs opacity-80">(מושגי יסוד)</span>
                  </button>
                  <button onClick={() => startQuizWithDifficulty(Difficulty.MEDIUM)} className="p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 flex items-center justify-between">
                    <span>🔵 רמה בינונית</span>
                    <span className="text-xs opacity-80">(ניתוח מודלים)</span>
                  </button>
                  <button onClick={() => startQuizWithDifficulty(Difficulty.HARD)} className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 flex items-center justify-between">
                    <span>🔴 רמה קשה</span>
                    <span className="text-xs opacity-80">(תרחישים מורכבים)</span>
                  </button>
                </div>
              </div>
            )}

            {quizStep === 'play' && currentQuizQuestions[currentQuizIdx] && (
              <div className="text-right">
                <div className="flex justify-between items-center mb-6">
                   <div className="bg-[#6c5ce7]/10 dark:bg-purple-900/40 text-[#6c5ce7] dark:text-[#a29bfe] px-4 py-1 rounded-full text-sm font-black">שאלה {currentQuizIdx + 1} מתוך {currentQuizQuestions.length}</div>
                   <div className="text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-tighter">רמה: {getDifficultyLabel(quizDifficulty)}</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl mb-8 font-bold text-xl leading-relaxed text-gray-800 dark:text-slate-200 transition-colors shadow-inner">{currentQuizQuestions[currentQuizIdx].q}</div>
                <div className="space-y-3">
                  {currentQuizQuestions[currentQuizIdx].a.map((opt, idx) => {
                    let btnClass = "w-full p-4 rounded-2xl text-right font-bold transition-all border-2 ";
                    if (answeredIdx === null) btnClass += "border-gray-200 dark:border-slate-700 hover:border-[#6c5ce7] dark:hover:border-[#a29bfe] hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-800 dark:text-slate-200";
                    else if (idx === currentQuizQuestions[currentQuizIdx].correct) btnClass += "bg-green-500 border-green-500 text-white scale-[1.02] shadow-xl";
                    else if (idx === answeredIdx) btnClass += "bg-red-500 border-red-500 text-white";
                    else btnClass += "border-gray-100 dark:border-slate-800 opacity-50 text-gray-800 dark:text-slate-400";
                    return <button key={idx} disabled={answeredIdx !== null} onClick={() => { if (answeredIdx === null) { setAnsweredIdx(idx); if (idx === currentQuizQuestions[currentQuizIdx].correct) setQuizScore(s => s + 1); } }} className={btnClass}>{opt}</button>;
                  })}
                </div>
                {answeredIdx !== null && (
                  <div className="mt-8">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border-r-4 border-yellow-500 mb-6 text-sm text-gray-700 dark:text-slate-300 shadow-sm">{currentQuizQuestions[currentQuizIdx].exp}</div>
                    <button onClick={nextQuestion} className="w-full bg-[#6c5ce7] text-white py-4 rounded-2xl font-black text-xl hover:brightness-110 shadow-lg transition-all active:scale-95">
                      {currentQuizIdx === currentQuizQuestions.length - 1 ? 'צפה בתוצאות ➔' : 'לשאלה הבאה ➔'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {quizStep === 'result' && (
              <div className="text-center py-10 relative">
                {quizResultPercentage >= 80 && (
                   <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                     <div className="text-4xl animate-bounce">🎊✨🎉🌟✨🎊</div>
                   </div>
                )}
                <div className="text-8xl mb-6 transform transition-transform animate-pulse">
                  {quizResultPercentage >= 80 ? '😊' : quizResultPercentage < 60 ? '😢' : '😐'}
                </div>
                <h2 className="text-4xl font-black mb-2 text-gray-800 dark:text-slate-100">
                  {quizUserName}, {quizResultPercentage >= 80 ? 'כל הכבוד! 🏆' : quizResultPercentage < 60 ? 'יש מה לשפר... 📚' : 'עבודה טובה! 👍'}
                </h2>
                <div className="text-6xl font-black text-[#6c5ce7] dark:text-[#a29bfe] mb-10 tabular-nums drop-shadow-lg">{quizResultPercentage}%</div>
                <div className="text-gray-500 dark:text-slate-400 font-bold mb-8">ענית נכון על {quizScore} שאלות מתוך {currentQuizQuestions.length}</div>
                <button onClick={() => { setIsQuizModalOpen(false); setQuizStep('name_entry'); setQuizUserName(''); }} className="bg-[#6c5ce7] text-white px-12 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95">חזור למסך הראשי</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && selectedExam && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative border-4 border-[#00b894] overflow-y-auto max-h-[90vh] custom-scrollbar flex flex-col transition-colors duration-300">
            <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-6 left-6 text-3xl opacity-30 hover:opacity-100 text-gray-500">✕</button>
            <header className="mb-8 border-b pb-4 text-right border-gray-100 dark:border-slate-700">
              <h2 className="text-3xl font-black text-[#00b894] dark:text-[#00e0b0]">{selectedExam.subject}</h2>
              <div className="flex items-center justify-end gap-2 text-gray-500 dark:text-slate-400 font-black mt-1"><span>תאריך בחינה: {selectedExam.date}</span><span className="text-xl">📅</span></div>
            </header>
            
            <div className="space-y-8 text-right mb-10">
               <div className="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-4 text-right">
                 <div className="flex flex-col items-end border-b pb-3 border-gray-100 dark:border-slate-700">
                    <span className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">👨‍🏫 המרצה האחראי</span>
                    <span className="font-black text-xl text-gray-800 dark:text-slate-200">{selectedExam.lecturer}</span>
                 </div>
                 <div className="flex flex-col items-end border-b pb-3 border-gray-100 dark:border-slate-700">
                    <span className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">✉️ כתובת אימייל</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => copyToClipboard(selectedExam.email)} className="text-[#6c5ce7] dark:text-[#a29bfe] bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg hover:scale-110 shadow-sm transition-transform">📋</button>
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400 underline decoration-dotted">{selectedExam.email}</span>
                    </div>
                 </div>
                 {selectedExam.phone && (
                   <div className="flex flex-col items-end">
                      <span className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">📞 טלפון ליצירת קשר</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => copyToClipboard(selectedExam.phone!)} className="text-[#00b894] dark:text-[#00e0b0] bg-green-100 dark:bg-green-900/30 p-2 rounded-lg hover:scale-110 shadow-sm transition-transform">📋</button>
                        <span className="font-black text-xl text-green-600 dark:text-green-400 tabular-nums">{selectedExam.phone}</span>
                      </div>
                   </div>
                 )}
               </div>

               <div className="p-8 bg-green-50/50 dark:bg-green-900/10 border-r-[10px] border-[#00b894] dark:border-[#00e0b0] rounded-[2.5rem] shadow-inner">
                  <span className="block font-black mb-4 text-[#00b894] dark:text-[#00e0b0] text-2xl underline decoration-double">📚 דגשים ומידע מורחב:</span>
                  <div className="whitespace-pre-line text-lg leading-[1.8] font-medium text-gray-800 dark:text-slate-200">{selectedExam.adminNote}</div>
               </div>
               
               {selectedExam.note2 && (
                 <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-[2.5rem] border-r-[10px] border-purple-400 dark:border-purple-600 shadow-inner">
                    <span className="block font-black text-purple-600 dark:text-purple-400 mb-3 text-sm uppercase tracking-widest">🎯 סיכום ממוקד (Quick Tips):</span>
                    <p className="text-base italic leading-relaxed text-gray-700 dark:text-slate-300">{selectedExam.note2}</p>
                 </div>
               )}
               {selectedExam.note3 && (
                 <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border-r-[10px] border-blue-400 dark:border-blue-600 shadow-inner">
                    <span className="block font-black text-blue-600 dark:text-blue-400 mb-3 text-sm uppercase tracking-widest">📝 הערות נוספות:</span>
                    <p className="text-base italic leading-relaxed text-gray-700 dark:text-slate-300">{selectedExam.note3}</p>
                 </div>
               )}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <a 
                href={selectedExam.link} 
                target="_blank" 
                className={`w-full py-5 rounded-[2rem] font-black text-center shadow-xl flex items-center justify-center gap-3 text-xl transition-all group ${selectedExam.link === '#' ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed pointer-events-none' : 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white hover:shadow-purple-500/40 shadow-purple-500/20 active:scale-95 shadow-lg'}`}
              >
                <span>{selectedExam.linkTitle || 'פתח חומר לימוד מלא'}</span><span>✨</span>
              </a>
              
              {/* DELINQUENCY SIMULATOR BUTTON IN MODAL */}
              {selectedExam.id === 2 && (
                <button 
                  onClick={() => { setIsInfoModalOpen(false); startDelinquencyQuiz(); }} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-5 rounded-[2rem] font-black text-center shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-xl shadow-orange-500/30"
                >
                  <span>תרגול למבחן 🎯</span>
                </button>
              )}

              {selectedExam.link2 && (
                <a href={selectedExam.link2} target="_blank" className="w-full bg-gradient-to-r from-[#00b894] to-[#55efc4] text-white py-5 rounded-[2rem] font-black text-center shadow-xl hover:shadow-teal-500/40 flex items-center justify-center gap-3 text-xl active:scale-95 transition-all">
                  <span>פתח סיכום ממוקד</span><span>🎯</span>
                </a>
              )}
              {selectedExam.link3 && (
                <a href={selectedExam.link3} target="_blank" className="w-full bg-blue-500 text-white py-5 rounded-[2rem] font-black text-center shadow-xl hover:brightness-110 flex items-center justify-center gap-3 text-xl active:scale-95 transition-all">
                  <span>חומר עזר נוסף</span><span>📝</span>
                </a>
              )}
              <a href={createGoogleCalendarUrl(selectedExam)} target="_blank" rel="noopener noreferrer" className="w-full bg-white dark:bg-[#1e293b] text-gray-600 dark:text-slate-300 py-4 rounded-[2rem] font-black text-center border-2 border-gray-100 dark:border-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center gap-3 text-lg transition-all">
                <span>רישום ביומן גוגל</span><span className="text-2xl">📅</span>
              </a>
              <button onClick={() => setIsInfoModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 py-4 rounded-[2rem] font-black text-center border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 text-lg mt-2">
                 <span>חזרה</span><span>➔</span>
              </button>
            </div>
           </div>
        </div>
      )}

      {/* Simple Contact Modal */}
      {contactModal.isOpen && (
        <div className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative border-2 border-gray-100 dark:border-slate-700 text-center text-gray-800 dark:text-slate-100 transition-colors">
            <button onClick={() => setContactModal({ ...contactModal, isOpen: false })} className="absolute top-4 left-4 text-2xl opacity-30 text-gray-500">✕</button>
            <div className="text-4xl mb-4">
              {contactModal.type === 'phone' ? '📞' : contactModal.type === 'email' ? '✉️' : '📅'}
            </div>
            <h3 className="text-lg font-bold mb-2">
              {contactModal.type === 'phone' ? 'מספר טלפון' : contactModal.type === 'email' ? 'כתובת אימייל' : 'הוספה ליומן'}
            </h3>
            
            {contactModal.type === 'calendar' && contactModal.exam ? (
               <div className="flex flex-col gap-4">
                 <p className="text-sm text-gray-500 dark:text-slate-400">הוסף את המבחן ב-{contactModal.exam.subject} ליומן גוגל שלך</p>
                 <a href={createGoogleCalendarUrl(contactModal.exam)} target="_blank" rel="noopener noreferrer" className="w-full bg-[#6c5ce7] text-white py-3 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform">פתח יומן גוגל 📅</a>
               </div>
            ) : (
               <>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl font-black text-xl mb-6 break-all shadow-inner">{contactModal.value}</div>
                <button onClick={() => copyToClipboard(contactModal.value)} className="w-full bg-[#6c5ce7] text-white py-3 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform">העתק 📋</button>
               </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-[#070b14] border-t border-gray-200 dark:border-slate-800 py-10 px-4 text-center mt-auto transition-colors duration-500">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="max-w-3xl mx-auto p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <p className="text-red-500 dark:text-red-400 text-[12px] italic font-black leading-relaxed">
              * הבהרה: המידע המופיע באתר אינו מהווה הצהרה רשמית של מוסד הלימודים. השימוש במידע, בסיכומים ובקישורים הוא על אחריות המשתמש בלבד. צחי אלבז ו/או המערכת אינם נושאים באחריות על תוכן החומרים המקושרים או על נכונותם. המערכת נועדה לסייע בארגון הלמידה בלבד, ומומלץ לעקוב תמיד אחר הודעות המרצים הרשמיות.
            </p>
          </div>

          <p className="text-gray-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            כל הזכויות שמורות לצחי אלבז © 2026 | מערכת ניהול משימות v12.0
          </p>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
