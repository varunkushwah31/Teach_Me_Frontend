import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getDocumentHistory,
    searchDocumentHistory,
    uploadDocument,
    generateSummary,
    generateQuiz,
    getSummary,
    type DocumentHistoryDTO,
    type DocumentSummaryDTO,
} from '../services/api';

export function useDocuments() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState<DocumentHistoryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async (searchQuery: string = '') => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = searchQuery.trim()
                ? await searchDocumentHistory(token, searchQuery.trim(), 0, 20)
                : await getDocumentHistory(token, 0, 20);
            setDocuments(res.content);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const upload = async (file: File, category: string): Promise<void> => {
        if (!token) throw new Error('Not authenticated');
        await uploadDocument(token, file, category, `upload-${crypto.randomUUID()}`);
        // Refresh list after a successful upload
        await fetchDocuments();
    };

    const triggerSummary = async (docId: number): Promise<void> => {
        if (!token) throw new Error('Not authenticated');
        await generateSummary(token, docId);
    };

    const fetchSummary = async (docId: number): Promise<DocumentSummaryDTO> => {
        if (!token) throw new Error('Not authenticated');
        return getSummary(token, docId);
    };

    const triggerQuiz = async (docId: number): Promise<void> => {
        if (!token) throw new Error('Not authenticated');
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
        triggerQuiz,
    };
}