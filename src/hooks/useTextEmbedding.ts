import { useState, useCallback } from 'react';
import { generateEmbedding as fetchEmbedding } from '@/services/embeddingService';

interface UseTextEmbeddingReturn {
    embedding: number[] | null;
    isLoading: boolean;
    error: string | null;
    generateEmbedding: (params: { apiEndpoint: string; model: string; prompt: string }) => Promise<void>;
    clearEmbedding: () => void;
}

export const useTextEmbedding = (): UseTextEmbeddingReturn => {
    const [embedding, setEmbedding] = useState<number[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const generateEmbedding = useCallback(async (params: { apiEndpoint: string; model: string; prompt: string }) => {
        if (!params.prompt || !params.prompt.trim()) {
            setError("Prompt is required to generate an embedding.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setEmbedding(null); // Clear previous results

        try {
            const result = await fetchEmbedding(params);
            setEmbedding(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            
            // Optional: You can still set mock data on failure if desired
            // const mockEmbedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
            // setEmbedding(mockEmbedding);
            // setError(`API Error: ${err.message}. Displaying mock data.`);
            
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearEmbedding = useCallback(() => {
        setEmbedding(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return { embedding, isLoading, error, generateEmbedding, clearEmbedding };
};