
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameMode, DifficultyLevel, CardData, ToastMessage, Direction } from './types.ts';
import { INITIAL_DIRECTIONS, DIFFICULTY_SETTINGS } from './constants.ts';
import { storage } from './services/storage.ts';
import Card from './components/Card.tsx';
import Toast from './components/Toast.tsx';

const App: React.FC = () => {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>(GameMode.SAME);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.EASY);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [lock, setLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Timer States
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToast({ text, type });
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        showToast(`Error: ${err.message}`, 'error');
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current as number);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as number);
    };
  }, [timerRunning, startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const shuffle = <T,>(arr: T[]): T[] => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const createDeck = useCallback(async (directions: Direction[], gameMode: GameMode, level: DifficultyLevel) => {
    const settings = DIFFICULTY_SETTINGS[level];
    
    let activeDirections: Direction[];
    if (level === DifficultyLevel.HARD) {
      activeDirections = directions.slice(8, 16);
    } else {
      activeDirections = directions.slice(0, settings.pairs);
    }
    
    const isTranslationRequired = level === DifficultyLevel.HARD || gameMode === GameMode.TRANSLATE;

    const newDeck: CardData[] = await Promise.all(activeDirections.flatMap(async (d) => {
      const cachedImage = await storage.getAsset(`img_${d.key}`);
      
      const c1: CardData = {
        id: Math.random().toString(36).substr(2, 9),
        key: d.key,
        emoji: d.emoji,
        text: d.en,
        lang: 'EN',
        isFlipped: false,
        isMatched: false,
        imageUrl: cachedImage || undefined
      };
      
      const c2: CardData = {
        id: Math.random().toString(36).substr(2, 9),
        key: d.key,
        emoji: d.emoji,
        text: isTranslationRequired ? d.pt : d.en,
        lang: isTranslationRequired ? 'PT' : 'EN',
        isFlipped: false,
        isMatched: false,
        imageUrl: cachedImage || undefined
      };
      return [c1, c2];
    })).then(results => results.flat());

    return shuffle(newDeck);
  }, []);

  useEffect(() => {
    const initGame = async () => {
      setLoading(true);
      const initialDeck = await createDeck(INITIAL_DIRECTIONS, mode, difficulty);
      setDeck(initialDeck);
      setLoading(false);
    };
    initGame();
  }, [createDeck, difficulty, mode]);

  const resetGame = async (newMode?: GameMode, newLevel?: DifficultyLevel) => {
    const finalMode = newMode ?? mode;
    const finalLevel = newLevel ?? difficulty;
    
    setLoading(true);
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setLock(false);
    setStartTime(null);
    setTimerRunning(false);
    setElapsedTime(0);
    
    const newDeck = await createDeck(INITIAL_DIRECTIONS, finalMode, finalLevel);
    setDeck(newDeck);
    
    if (newMode) setMode(newMode);
    if (newLevel) setDifficulty(newLevel);
    
    setLoading(false);
  };

  const updateCard = (id: string, updates: Partial<CardData>) => {
    setDeck(prev => prev.map(card => {
      if (card.id === id) return { ...card, ...updates };
      return card;
    }));
  };

  const onFlip = (id: string) => {
    if (lock || flippedIds.length >= 2) return;
    
    if (startTime === null) {
      setStartTime(Date.now());
      setTimerRunning(true);
    }

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setLock(true);
      const [id1, id2] = newFlipped;
      const card1 = deck.find(c => c.id === id1)!;
      const card2 = deck.find(c => c.id === id2)!;
      
      const isTranslation = difficulty === DifficultyLevel.HARD || mode === GameMode.TRANSLATE;
      const isMatch = card1.key === card2.key && (isTranslation ? card1.lang !== card2.lang : card1.lang === card2.lang);

      if (isMatch) {
        setTimeout(() => {
          setDeck(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, isMatched: true } : c));
          const newMatches = matches + 1;
          setMatches(newMatches);
          setFlippedIds([]);
          setLock(false);
          
          const totalPairs = DIFFICULTY_SETTINGS[difficulty].pairs;
          if (newMatches === totalPairs) {
            setTimerRunning(false);
            showToast("Mastered!", 'success');
          } else {
            showToast("Matched!", 'success');
          }
        }, 600);
      } else {
        setTimeout(() => {
          setFlippedIds([]);
          setLock(false);
        }, 1000);
      }
    }
  };

  const gridStyles = useMemo(() => {
    if (isFullScreen) {
      const totalCards = DIFFICULTY_SETTINGS[difficulty].pairs * 2;
      let cols = 4;
      if (totalCards >= 30) cols = 6;
      else if (totalCards === 16) cols = 4;
      else if (totalCards > 8) cols = 4;
      
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: '1fr',
        width: '100vw',
        height: '100vh',
        gap: '0.4rem',
        padding: '0.4rem',
      };
    }
    return undefined;
  }, [difficulty, isFullScreen]);

  return (
    <div className={`min-h-screen ${isFullScreen ? 'bg-slate-950 overflow-hidden' : 'pb-12 bg-slate-50'}`}>
      {!isFullScreen && (
        <header className="bg-white border-b sticky top-0 z-40 shadow-sm w-full">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-route text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Polyglot Directions</h1>
                {difficulty === DifficultyLevel.HARD && (
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Speed Challenge</span>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm font-bold text-slate-600">
              <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-mono">
                <i className="fas fa-clock mr-2 text-slate-400"></i>
                {formatTime(elapsedTime)}
              </div>
              <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700">Moves: {moves}</div>
              <div className="bg-green-50 px-4 py-2 rounded-xl text-green-700">{matches} / {DIFFICULTY_SETTINGS[difficulty].pairs} Matches</div>
            </div>

            <div className="flex gap-2">
              <button aria-label="Toggle Fullscreen" onClick={toggleFullScreen} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 border border-slate-100"><i className="fas fa-expand"></i></button>
              <button aria-label="Reset Game" onClick={() => resetGame()} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 border border-slate-100"><i className="fas fa-redo-alt"></i></button>
            </div>
          </div>
        </header>
      )}

      {isFullScreen && (
        <div className="fixed top-4 left-4 z-[60] flex gap-4 items-center">
           <button onClick={toggleFullScreen} className="bg-white/10 hover:bg-white/20 backdrop-blur-md w-10 h-10 rounded-full text-white transition-all shadow-xl"><i className="fas fa-compress"></i></button>
           <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-white text-[12px] font-mono border border-white/10 shadow-xl">
             <i className="fas fa-clock mr-2"></i>{formatTime(elapsedTime)}
           </div>
           <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-xl">Progress: {matches} / {DIFFICULTY_SETTINGS[difficulty].pairs}</div>
        </div>
      )}

      <main className={`${isFullScreen ? 'w-full h-full' : 'max-w-[1400px] mx-auto px-6 mt-8'}`}>
        {!isFullScreen && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div role="tablist" className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              {Object.values(DifficultyLevel).map(level => (
                <button 
                  key={level} 
                  role="tab"
                  aria-selected={difficulty === level}
                  onClick={() => resetGame(mode, level)} 
                  className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${difficulty === level ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {DIFFICULTY_SETTINGS[level].label}
                </button>
              ))}
            </div>
            
            {difficulty !== DifficultyLevel.HARD && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => resetGame(GameMode.SAME, difficulty)}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${mode === GameMode.SAME ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Same
                </button>
                <button 
                  onClick={() => resetGame(GameMode.TRANSLATE, difficulty)}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${mode === GameMode.TRANSLATE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Translate
                </button>
              </div>
            )}
            
            {difficulty === DifficultyLevel.HARD && (
              <div className="px-5 py-2 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-amber-100">
                ⚡ Hard: Translation Speed Test (16 Cards)
              </div>
            )}
          </div>
        )}

        <div style={gridStyles} className={!isFullScreen ? `grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4` : ''}>
          {deck.map(card => (
            <Card 
              key={card.id} 
              card={{ ...card, isFlipped: flippedIds.includes(card.id) }} 
              onFlip={onFlip} 
              onUpdate={updateCard} 
              disabled={lock || loading} 
              isFullScreen={isFullScreen} 
              difficulty={difficulty}
            />
          ))}
        </div>
      </main>

      {matches === DIFFICULTY_SETTINGS[difficulty].pairs && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] text-center border border-white/20 animate-scale-in max-w-lg w-full">
            <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-trophy text-6xl text-yellow-500"></i>
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Level Complete!</h2>
            
            <div className="flex justify-center gap-8 my-8">
              <div className="text-center">
                <div className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Time</div>
                <div className="text-3xl font-mono font-black text-indigo-600">{formatTime(elapsedTime)}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Moves</div>
                <div className="text-3xl font-mono font-black text-indigo-600">{moves}</div>
              </div>
            </div>

            <button onClick={() => resetGame()} className="w-full bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Restart</button>
          </div>
        </div>
      )}

      <Toast message={toast} onClear={() => setToast(null)} />
      {loading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center flex flex-col items-center border border-slate-100">
            <div className="w-16 h-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-indigo-900 font-black uppercase text-xs tracking-widest">Generating Challenge</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
