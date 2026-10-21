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
  const [cards, setCards] = useState(content.cards || []);
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
      <div className="p-8 text-center text-[#868E96]">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] bg-[#0066FF]/10 px-2.5 py-0.5 rounded-full">
            Flashcard Deck
          </span>
          <h3 className="text-base font-bold text-[#121316] dark:text-[#F3F4F6] mt-1">
            {lessonTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#868E96] font-mono">
            Mastered: {masteredCount}/{cards.length}
          </span>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#121316] dark:text-[#F3F4F6] transition"
            title="Shuffle deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 max-w-xl mx-auto py-2">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full min-h-[300px] sm:min-h-[340px] cursor-pointer transition-all duration-300 rounded-3xl p-8 flex flex-col justify-between select-none shadow-md border ${
            isFlipped
              ? 'bg-[#0066FF] text-white border-[#0066FF]'
              : 'bg-white dark:bg-[#131418] text-[#121316] dark:text-[#F3F4F6] border-black/[0.08] dark:border-white/[0.1] hover:border-[#0066FF]/40'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between text-xs opacity-75">
            <span className="font-mono font-bold">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
              <RotateCw className="w-3 h-3" />
              {isFlipped ? 'Answer' : 'Click or Space to Flip'}
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-6 text-center">
            {isFlipped ? (
              <p className="text-base sm:text-lg font-medium leading-relaxed tracking-wide">
                {currentCard.back}
              </p>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight">
                {currentCard.front}
              </h2>
            )}
          </div>

          {/* Card Bottom Indicator */}
          <div className="flex items-center justify-between pt-4 border-t border-current/15 text-xs">
            <span className="text-[11px] opacity-75">
              {isFlipped ? 'Click to view question' : 'Think of the answer, then click to flip'}
            </span>

            {isCurrentMastered && (
              <span className="flex items-center gap-1 font-semibold text-[11px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Mastered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex items-center justify-between max-w-xl mx-auto pt-2">
        <button
          onClick={handlePrev}
          className="btn-secondary px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={toggleMastered}
          className={`px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 transition ${
            isCurrentMastered
              ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/20'
              : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#868E96] hover:text-[#121316] dark:hover:text-[#F3F4F6]'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {isCurrentMastered ? 'Mastered' : 'Mark as Mastered'}
        </button>

        <button
          onClick={handleNext}
          className="btn-primary px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
