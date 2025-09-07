import { useState, useCallback } from 'react';
import { generateEmbedding } from '@/services/embeddingService';
import { searchAnimeByVector } from '@/services/animeService';
import { SimilarAnimeItem } from '@/types';

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
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
