import { useState, useCallback, useRef } from 'react';
import { generateEmbedding as fetchEmbedding } from '@/services/embeddingService';

interface UseTextEmbeddingReturn {
    embedding: number[] | null;
    isLoading: boolean;
    error: string | null;
    progress: number;
    generateEmbedding: (params: { prompt: string }) => void;
    clearEmbedding: () => void;
}

export const useTextEmbedding = (): UseTextEmbeddingReturn => {
    const [embedding, setEmbedding] = useState<number[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateEmbedding = useCallback((params: { prompt: string }) => {
        if (!params.prompt || !params.prompt.trim()) {
            setError("Prompt is required to generate an embedding.");
            return;
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoading(true);
        setError(null);
        setEmbedding(null);
        setProgress(0);

        // Start processing in chunks to allow animation frames
        const processEmbedding = async () => {
            try {
                // Simulate progress in 20% increments
                for (let i = 0; i <= 4; i++) {
                    if (abortController.signal.aborted) return;
                    setProgress(i * 20);
                    await new Promise(resolve => 
                        requestIdleCallback(resolve, { timeout: 100 })
                    );
                }

                // Actual embedding generation (only pass params)
                const result = await fetchEmbedding(params);
                if (abortController.signal.aborted) return;
                
                setEmbedding(result);
                setProgress(100);
            } catch (err) {
                // Proper error type handling
                if (err instanceof Error && err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                    abortControllerRef.current = null;
                }
            }
        };

        processEmbedding();
    }, []);

    const clearEmbedding = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setEmbedding(null);
        setError(null);
        setIsLoading(false);
        setProgress(0);
    }, []);

    return { embedding, isLoading, error, progress, generateEmbedding, clearEmbedding };
};
