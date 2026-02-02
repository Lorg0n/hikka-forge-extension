import { useState, useEffect, useCallback } from 'react';

export interface NovelDetails {
  slug: string;
  native_score: number;
  native_scored_by: number;
  score: number;
  scored_by: number;
}

interface useNovelDetailsProps {
  slug: string;
}

interface useNovelDetailsReturn {
  data: NovelDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useNovelDetails = ({ slug }: useNovelDetailsProps): useNovelDetailsReturn => {
  const [data, setData] = useState<NovelDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNovelDetails = useCallback(async () => {
    if (!slug) {
      setError('Slug is required to fetch novel details.');
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.hikka.io/novel/${slug}`, {
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      const extracted: NovelDetails = {
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
    loadNovelDetails();
  }, [loadNovelDetails]);

  const refresh = () => {
    loadNovelDetails();
  };

  return { data, loading, error, refresh };
};
