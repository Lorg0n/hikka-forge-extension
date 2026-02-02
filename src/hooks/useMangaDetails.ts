import { useState, useEffect, useCallback } from 'react';

export interface MangaDetails {
  slug: string;
  native_score: number;
  native_scored_by: number;
  score: number;
  scored_by: number;
}

interface useMangaDetailsProps {
  slug: string;
}

interface useMangaDetailsReturn {
  data: MangaDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useMangaDetails = ({ slug }: useMangaDetailsProps): useMangaDetailsReturn => {
  const [data, setData] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMangaDetails = useCallback(async () => {
    if (!slug) {
      setError('Slug is required to fetch manga details.');
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.hikka.io/manga/${slug}`, {
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      const extracted: MangaDetails = {
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
    loadMangaDetails();
  }, [loadMangaDetails]);

  const refresh = () => {
    loadMangaDetails();
  };

  return { data, loading, error, refresh };
};
