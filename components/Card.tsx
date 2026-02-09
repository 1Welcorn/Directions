
import React, { useState } from 'react';
import { CardData, DifficultyLevel } from '../types.ts';
import { speakText, generateImage } from '../services/gemini.ts';
import { storage } from '../services/storage.ts';

interface CardProps {
  card: CardData;
  onFlip: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CardData>) => void;
  disabled: boolean;
  isFullScreen?: boolean;
  difficulty?: DifficultyLevel;
}

const Card: React.FC<CardProps> = ({ card, onFlip, onUpdate, disabled, isFullScreen, difficulty }) => {
  const [genLoading, setGenLoading] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await speakText(card.text, card.lang);
    } catch (err) {
      console.error("Speech error", err);
    }
  };

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (genLoading) return;
    
    setGenLoading(true);
    try {
      const imageUrl = await generateImage(card.text);
      await storage.setAsset(`img_${card.key}`, imageUrl);
      onUpdate(card.id, { imageUrl });
    } catch (err: any) {
      console.error("Image generation failed", err);
    } finally {
      setGenLoading(false);
    }
  };

  const heightClass = isFullScreen ? "h-full min-h-0 w-full" : "h-72 sm:h-96 lg:h-[30rem]";
  const isHard = difficulty === DifficultyLevel.HARD;

  return (
    <div 
      className={`relative ${heightClass} perspective-1000 cursor-pointer group ${card.isMatched ? 'opacity-90' : ''}`}
      onClick={() => !disabled && !card.isFlipped && !card.isMatched && onFlip(card.id)}
    >
      <div className={`w-full h-full transform-style-3d transition-transform duration-700 relative ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
        
        {/* Front (Hidden state) */}
        <div className={`absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-black ${isFullScreen ? 'rounded-2xl border' : 'rounded-[3rem] border-[6px]'} border-white/10 shadow-2xl flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative group-hover:scale-110 transition-transform duration-500">
             <div className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full"></div>
             <span className={`${isFullScreen ? 'text-4xl sm:text-6xl' : 'text-8xl'} font-black text-white/10 select-none relative z-10`}>?</span>
          </div>
        </div>

        {/* Back (Revealed state) */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white ${isFullScreen ? 'rounded-xl' : 'rounded-[3rem]'} overflow-hidden shadow-2xl flex flex-col`}>
          <div className="absolute inset-0 w-full h-full">
            {card.imageUrl ? (
              <img 
                src={card.imageUrl} 
                alt={card.text} 
                className="w-full h-full object-cover transition-transform duration-[10s] ease-linear group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-50 to-indigo-50/30">
                <span className={`${isFullScreen ? 'text-[8rem] sm:text-[12rem]' : 'text-[15rem]'} filter grayscale opacity-[0.05] select-none`}>
                  {card.emoji}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/30"></div>
          </div>
          
          <div className="relative z-20 w-full h-full flex flex-col items-center justify-between p-1 sm:p-4 pointer-events-none">
            <div className="h-1"></div>
            <div className={`w-full max-w-[99%] bg-white/90 backdrop-blur-2xl ${isFullScreen ? 'rounded-xl sm:rounded-2xl' : 'rounded-[1.8rem] sm:rounded-[2.5rem]'} border border-white/60 shadow-2xl p-2 sm:p-5 flex flex-col items-center justify-center pointer-events-auto transform transition-all group-hover:bg-white/98`}>
              <div className={`${isFullScreen ? 'text-3xl sm:text-5xl lg:text-7xl' : 'text-6xl sm:text-8xl'} mb-1 sm:mb-2 drop-shadow-2xl`}>
                {card.emoji}
              </div>
              <div className={`
                ${isFullScreen 
                  ? (isHard ? 'text-sm sm:text-xl lg:text-3xl' : 'text-lg sm:text-2xl lg:text-5xl') 
                  : 'text-xl sm:text-3xl lg:text-5xl'
                } 
                font-black text-slate-950 text-center leading-[0.9] tracking-tighter uppercase 
                w-full break-words hyphens-auto px-1 sm:px-2 drop-shadow-sm
              `}>
                {card.text}
              </div>
              <div className={`mt-2 sm:mt-5 flex items-center justify-between w-full gap-2 border-t border-slate-200/50 pt-2 sm:pt-4`}>
                <span className={`${isFullScreen ? 'text-[7px] px-1.5 py-0.5' : 'text-[9px] px-3 py-1'} font-black rounded-md text-white shadow-md ${card.lang === 'EN' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  {card.lang}
                </span>
                {(card.isFlipped || card.isMatched) && (
                  <div className="flex gap-1 sm:gap-2">
                    <button onClick={handleSpeak} className={`${isFullScreen ? 'w-6 h-6 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-12 sm:h-12'} rounded-lg sm:rounded-xl bg-slate-50 text-indigo-600 shadow-sm flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90 border border-slate-200`}>
                      <i className={`fas fa-volume-up ${isFullScreen ? 'text-[10px] sm:text-sm' : 'text-xs sm:text-lg'}`}></i>
                    </button>
                    {!card.imageUrl && (
                      <button onClick={handleGenerateImage} disabled={genLoading} className={`${isFullScreen ? 'w-6 h-6 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-12 sm:h-12'} rounded-lg sm:rounded-xl bg-slate-50 text-amber-500 shadow-sm flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all active:scale-90 border border-slate-200 ${genLoading ? 'animate-pulse' : ''}`}>
                        <i className={`fas ${genLoading ? 'fa-circle-notch fa-spin' : 'fa-wand-sparkles'} ${isFullScreen ? 'text-[10px] sm:text-sm' : 'text-xs sm:text-lg'}`}></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="h-1"></div>
          </div>
        </div>
      </div>
      {card.isMatched && (
        <div className={`absolute -top-2 -right-2 ${isFullScreen ? 'w-8 h-8 sm:w-12 sm:h-12 rounded-xl' : 'w-10 h-10 sm:w-14 sm:h-14 rounded-2xl'} bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center shadow-2xl z-30 border-2 sm:border-4 border-white animate-pulse`}>
          <i className={`fas fa-check ${isFullScreen ? 'text-sm sm:text-xl' : 'text-lg sm:text-2xl'}`}></i>
        </div>
      )}
    </div>
  );
};

export default Card;
