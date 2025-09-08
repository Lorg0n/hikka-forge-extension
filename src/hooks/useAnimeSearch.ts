import { useState, useCallback } from 'react';
import { generateEmbedding, isEmbeddingServiceAvailable } from '@/services/embeddingService';
import { searchAnimeByVector } from '@/services/animeService';
import { SimilarAnimeItem } from '@/types';
import { supportsWebAssembly } from '@/utils/webassembly-check';

interface UseAnimeSearchReturn {
  results: SimilarAnimeItem[] | null;
  loading: boolean;
  error: string | null;
  search: (text: string) => void;
  clear: () => void;
}

export const useAnimeSearch = (): UseAnimeSearchReturn => {
  const [results, setResults] = useState<SimilarAnimeItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Search text is required');
      return;
    }

    // Check WebAssembly support before attempting search
    if (!isEmbeddingServiceAvailable()) {
      setError('Search feature requires WebAssembly support. Your browser does not support WebAssembly.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Generate embedding from text
      const embedding = await generateEmbedding({ prompt: text });
      
      // Search anime using the embedding vector
      const response = await searchAnimeByVector({ embedding });
      setResults(response.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
        setError('Search failed: Your browser does not support the required technology (WebAssembly). Please try a modern browser like Chrome, Firefox, or Edge.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setError('Search failed: Network connection issue. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
};
