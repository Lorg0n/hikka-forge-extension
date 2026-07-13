import { useState, useEffect, useCallback } from 'react';
import { FranchiseContentType, FranchiseGraphResponse, GraphEdge, GraphNode } from '@/types';
import { fetchFranchiseGraph } from '@/services/animeService';

interface UseContentRelationsProps {
    contentType: FranchiseContentType;
    slug: string;
}

interface UseContentRelationsReturn {
    nodes: GraphNode[];
    edges: GraphEdge[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useContentRelations = ({
    contentType,
    slug,
}: UseContentRelationsProps): UseContentRelationsReturn => {
    const [data, setData] = useState<FranchiseGraphResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadRelations = useCallback(async () => {
        if (!slug || !contentType) {
            setError('Slug and content type are required to fetch relations.');
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFranchiseGraph({ contentType, slug });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [contentType, slug]);

    useEffect(() => {
        loadRelations();
    }, [loadRelations]);

    const refresh = () => {
        loadRelations();
    };

    return {
        nodes: data?.nodes ?? [],
        edges: data?.edges ?? [],
        loading,
        error,
        refresh,
    };
};
