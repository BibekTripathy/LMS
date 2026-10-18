import React, { useState, useEffect, useCallback } from 'react';
import type { FlashcardContent } from '../../types';
import { RotateCw, ChevronLeft, ChevronRight, Shuffle, Check } from 'lucide-react';

interface FlashcardViewerProps {
  content: FlashcardContent;
  lessonTitle: string;
  onClose?: () => void;
}

/** Render with `key={resource.id}` so switching resources starts a fresh deck. */
export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  content,
  lessonTitle,
  onClose,
}) => {
  const [cards, setCards] = useState(content.flashcards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  }, [cards.length]);

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setMasteredCards({});
  };

  const toggleMastered = () => {
    setMasteredCards((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No flashcards found in this resource.
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const masteredCount = Object.values(masteredCards).filter(Boolean).length;
  const isCurrentMastered = !!masteredCards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
            Interactive Deck
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {lessonTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Mastered: {masteredCount}/{cards.length}
          </span>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Shuffle deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 max-w-xl mx-auto py-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full min-h-[300px] sm:min-h-[340px] cursor-pointer transition-transform duration-500 rounded-3xl p-8 flex flex-col justify-between shadow-xl border select-none ${
            isFlipped
              ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 text-white border-purple-400'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between text-xs opacity-75">
            <span className="font-mono font-bold">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
              <RotateCw className="w-3 h-3" />
              {isFlipped ? 'Answer / Explanation' : 'Click or Space to Flip'}
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-6 text-center">
            {isFlipped ? (
              <p className="text-lg sm:text-xl font-medium leading-relaxed tracking-wide animate-in fade-in">
                {currentCard.back}
              </p>
            ) : (
              <h2 className="text-xl sm:text-2xl font-extrabold leading-snug tracking-tight text-slate-800 dark:text-white">
                {currentCard.front}
              </h2>
            )}
          </div>

          {/* Card Bottom Indicator */}
          <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs">
            <span className="text-[11px] opacity-70">
              {isFlipped ? 'Flip back for term' : 'Think of the answer, then flip'}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMastered();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                isCurrentMastered
                  ? 'bg-emerald-500 text-white'
                  : isFlipped
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {isCurrentMastered ? 'Mastered' : 'Mark as Known'}
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Controls */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={handlePrev}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition"
          title="Previous card (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-bold text-slate-500 font-mono">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          onClick={handleNext}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition"
          title="Next card (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
