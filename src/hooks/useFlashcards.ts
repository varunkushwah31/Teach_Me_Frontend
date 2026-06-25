import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDueFlashcards, reviewFlashcard, createFlashcard, type FlashcardDTO } from '../services/api';

export function useFlashcards() {
    const { token } = useAuth();
    const [dueCards, setDueCards] = useState<FlashcardDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDueCards = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const cards = await getDueFlashcards(token);
            setDueCards(cards);
        } catch (err) {
            console.error("Failed to fetch flashcards", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const reviewCard = async (flashcardId: number, quality: number) => {
        if (!token) return;
        try {
            await reviewFlashcard(token, flashcardId, quality);
            // Remove the reviewed card from the local state array
            setDueCards(prev => prev.filter(c => c.id !== flashcardId));
        } catch (err) {
            console.error("Failed to submit review", err);
            throw err;
        }
    };

    const saveNewCard = async (text: string, category: string) => {
        if (!token) return;
        await createFlashcard(token, {
            front: "AI Concept Review",
            back: text,
            sourceContent: text,
            deckName: category
        });
    };

    return { dueCards, loading, fetchDueCards, reviewCard, saveNewCard };
}