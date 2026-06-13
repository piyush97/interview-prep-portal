import { useEffect, useState } from "react";
import { getFlashcardDecks, getFlashcardsByDeck, updateFlashcardLevel, getDueFlashcards } from "../store";
import type { Flashcard } from "../types";
import { Layers, Brain, Eye, ThumbsUp, ThumbsDown } from "lucide-react";

export default function Flashcards() {
  const [decks, setDecks] = useState<string[]>([]);
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<"browse" | "practice">("browse");

  useEffect(() => {
    setDecks(getFlashcardDecks());
  }, []);

  const selectDeck = (deck: string) => {
    setActiveDeck(deck);
    setCards(getFlashcardsByDeck(deck));
    setCurrentIdx(0);
    setRevealed(false);
    setMode("browse");
  };

  const startPractice = () => {
    const due = getDueFlashcards();
    if (due.length === 0) {
      alert("All flashcards are mastered! 🎉");
      return;
    }
    setCards(due);
    setActiveDeck(null);
    setCurrentIdx(0);
    setRevealed(false);
    setMode("practice");
  };

  const current = cards[currentIdx];

  const handleRate = (level: number) => {
    if (!current) return;
    updateFlashcardLevel(current.id, level);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setRevealed(false);
    } else {
      alert("Deck complete! 🎉");
      setMode("browse");
      setActiveDeck(null);
    }
  };

  const handleNext = () => {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setRevealed(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-500 mt-1">Spaced-repetition interview Q&A</p>
        </div>
        <button
          onClick={startPractice}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Brain size={16} /> Practice Due ({getDueFlashcards().length})
        </button>
      </div>

      {/* Deck selection */}
      {!activeDeck && mode === "browse" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {decks.map((deck) => {
            const deckCards = getFlashcardsByDeck(deck);
            const avgLevel = Math.round(deckCards.reduce((s, c) => s + c.level, 0) / deckCards.length);
            return (
              <div
                key={deck}
                onClick={() => selectDeck(deck)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={18} className="text-indigo-500" />
                  <h3 className="font-medium text-gray-900 text-sm">{deck}</h3>
                </div>
                <p className="text-xs text-gray-500">{deckCards.length} cards</p>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < avgLevel ? "bg-green-400" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse / Practice mode */}
      {(activeDeck || mode === "practice") && current && (
        <div>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => { setActiveDeck(null); setMode("browse"); }} className="text-sm text-gray-500 hover:text-gray-700">
                &larr; Back
              </button>
              <span className="text-sm text-gray-400">
                {mode === "practice" ? "Practice" : activeDeck} — {currentIdx + 1}/{cards.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} disabled={currentIdx === 0}
                className="px-2 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">
                Prev
              </button>
              <button onClick={handleNext} disabled={currentIdx >= cards.length - 1}
                className="px-2 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                current.category === "technical" ? "bg-blue-50 text-blue-600" :
                current.category === "behavioral" ? "bg-green-50 text-green-600" :
                current.category === "system-design" ? "bg-purple-50 text-purple-600" :
                current.category === "ai-ml" ? "bg-orange-50 text-orange-600" :
                "bg-gray-50 text-gray-600"
              }`}>{current.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                current.difficulty === "easy" ? "bg-green-50 text-green-600" :
                current.difficulty === "medium" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
              }`}>{current.difficulty}</span>
              <span className="text-xs text-gray-400">Level {current.level}/5</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-6">{current.question}</h3>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100"
              >
                <Eye size={16} /> Show Answer
              </button>
            ) : (
              <div>
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-400 mb-2">Answer:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{current.answer}</p>
                </div>

                {mode === "practice" && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-3">How well did you know this?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleRate(Math.min(5, current.level + 1))}
                        className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
                        <ThumbsUp size={14} /> Knew it
                      </button>
                      <button onClick={() => handleRate(current.level)}
                        className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm hover:bg-amber-100">
                        Brain icon Knew partially
                      </button>
                      <button onClick={() => handleRate(Math.max(1, current.level - 1))}
                        className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">
                        <ThumbsDown size={14} /> Struggled
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!activeDeck && mode === "browse" && decks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No flashcard decks available.
        </div>
      )}
    </div>
  );
}
