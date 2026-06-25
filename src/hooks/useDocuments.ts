import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getDocumentHistory,
    searchDocumentHistory,
    uploadDocument,
    generateSummary,
    generateQuiz,
    getSummary,
    type DocumentHistoryDTO
} from '../services/api';

export function useDocuments() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState<DocumentHistoryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async (searchQuery: string = '') => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = searchQuery.trim()
                ? await searchDocumentHistory(token, searchQuery, 0, 20)
                : await getDocumentHistory(token, 0, 20);
            setDocuments(res.content);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const upload = async (file: File, category: string) => {
        if (!token) return;
        setLoading(true);
        try {
            await uploadDocument(token, file, category, `upload-${crypto.randomUUID()}`);
            await fetchDocuments(); // Auto-refresh the list
        } catch (err: unknown) {
            throw new Error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const triggerSummary = async (docId: number) => {
        if (!token) return;
        await generateSummary(token, docId);
    };

    const fetchSummary = async (docId: number) => {
        if (!token) throw new Error("No token");
        return await getSummary(token, docId);
    };

    const triggerQuiz = async (docId: number) => {
        if (!token) return;
        await generateQuiz(token, docId);
    };

    return {
        documents,
        loading,
        error,
        fetchDocuments,
        upload,
        triggerSummary,
        fetchSummary,
        triggerQuiz
    };
}