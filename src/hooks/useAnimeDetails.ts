import { useState, useEffect, useCallback } from 'react';

export interface AnimeDetails {
  slug: string;
  native_score: number;
  native_scored_by: number;
  score: number;
  scored_by: number;
}

interface UseAnimeDetailsProps {
  slug: string;
}

interface UseAnimeDetailsReturn {
  data: AnimeDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useAnimeDetails = ({ slug }: UseAnimeDetailsProps): UseAnimeDetailsReturn => {
  const [data, setData] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnimeDetails = useCallback(async () => {
    if (!slug) {
      setError('Slug is required to fetch anime details.');
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.hikka.io/anime/${slug}`, {
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      const extracted: AnimeDetails = {
        slug: json.slug,
        native_score: json.native_score,
        native_scored_by: json.native_scored_by,
        score: json.score,
        scored_by: json.scored_by,
      };

      setData(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadAnimeDetails();
  }, [loadAnimeDetails]);

  const refresh = () => {
    loadAnimeDetails();
  };

  return { data, loading, error, refresh };
};
