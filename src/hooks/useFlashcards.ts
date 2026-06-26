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
            console.error('Failed to fetch flashcards', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    /**
     * Submit a quality rating (1/3/5) for a card.
     * Only removes it from the local state AFTER the server confirms success.
     * Throws on failure so the caller can show an error without advancing the UI.
     */
    const reviewCard = async (flashcardId: number, quality: number) => {
        if (!token) throw new Error('Not authenticated');
        await reviewFlashcard(token, flashcardId, quality);
        // Remove from local state only after a successful API response
        setDueCards(prev => prev.filter(c => c.id !== flashcardId));
    };

    const saveNewCard = async (text: string, category: string) => {
        if (!token) throw new Error('Not authenticated');
        await createFlashcard(token, {
            front: 'AI Concept Review',
            back: text,
            sourceContent: text,
            deckName: category,
        });
    };

    return { dueCards, loading, fetchDueCards, reviewCard, saveNewCard };
}