import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocumentQuizzes, submitQuiz, type QuizDTO, type QuizResponseDTO } from '../services/api';

export function useQuizzes() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchQuizzesForDocument = useCallback(async (documentId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await getDocumentQuizzes(token, documentId);
            setQuizzes(data);
        } catch (err) {
            console.error('Failed to fetch quizzes', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    /**
     * Submit answers and return the graded result.
     * Throws on failure — callers should catch and display an error to the user.
     */
    const gradeQuiz = async (quizId: number, answers: number[]): Promise<QuizResponseDTO> => {
        if (!token) throw new Error('Not authenticated');
        setLoading(true);
        try {
            return await submitQuiz(token, quizId, answers);
        } finally {
            setLoading(false);
        }
    };

    return { quizzes, loading, fetchQuizzesForDocument, gradeQuiz };
}