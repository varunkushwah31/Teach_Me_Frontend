import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDueFlashcards, reviewFlashcard, type FlashcardDTO } from '../services/api';
import { Layers, Check, X, RotateCcw, Loader2 } from 'lucide-react';

const StudyPage: React.FC = () => {
    const { token } = useAuth();
    const [cards, setCards] = useState<FlashcardDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getDueFlashcards(token)
            .then(setCards)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    const handleReview = async (quality: number) => {
        if (!token) return;
        const currentCard = cards[currentIndex];

        try {
            await reviewFlashcard(token, currentCard.id, quality);
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } catch (err) {
            console.error("Failed to submit review", err);
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" /></div>;

    if (currentIndex >= cards.length) {
        return (
            <div className="flex flex-col h-full bg-[#0a0a0a] items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
                <p className="text-zinc-400">No more flashcards due for review today.</p>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-8 overflow-hidden">
            <div className="max-w-2xl mx-auto w-full flex flex-col h-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                            <Layers className="w-5 h-5 text-[#968fff]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Study Mode</h2>
                    </div>
                    <span className="bg-zinc-800 text-zinc-300 text-sm px-3 py-1 rounded-full font-medium border border-zinc-700">
                        {currentIndex + 1} / {cards.length} Remaining
                    </span>
                </div>

                {/* Flashcard Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-100">
                    <button
                        // ✅ Fix: Use semantic <button> instead of <div role="button">
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="w-full h-96 relative cursor-pointer group perspective-1000 bg-transparent p-0 border-0"
                    >
                        <div className={`w-full h-full absolute transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                            {/* Front of Card */}
                            <div className="absolute inset-0 backface-hidden bg-[#111111]/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl flex flex-col justify-center items-center text-center hover:border-zinc-700/80">
                                <span className="absolute top-4 left-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">{currentCard.deckName}</span>
                                <p className="text-xl text-white font-medium leading-relaxed">{currentCard.front}</p>
                                <p className="absolute bottom-6 text-sm text-zinc-600 font-medium tracking-wide">Click to flip</p>
                            </div>

                            {/* Back of Card */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-[#1a1a1a] to-[#111111] border border-[#5b4fff]/30 rounded-2xl p-8 shadow-2xl shadow-[#5b4fff]/10 flex flex-col justify-center items-center text-center overflow-y-auto">
                                <p className="text-lg text-zinc-200 leading-relaxed whitespace-pre-wrap">{currentCard.back}</p>
                            </div>

                        </div>
                    </button>
                </div>

                {/* Controls */}
                <div className={`mt-8 flex justify-center gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => handleReview(1)} className="flex-1 max-w-30 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                        <X className="w-4 h-4" /> Hard
                    </button>
                    <button onClick={() => handleReview(3)} className="flex-1 max-w-30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                        <RotateCcw className="w-4 h-4" /> Good
                    </button>
                    <button onClick={() => handleReview(5)} className="flex-1 max-w-30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                        <Check className="w-4 h-4" /> Easy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyPage;