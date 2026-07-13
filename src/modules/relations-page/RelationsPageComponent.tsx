import React, { useMemo } from 'react';
import { useContentRelations } from '@/hooks/useContentRelations';
import NotFound from '@/components/ui/not-found';
import { RelationsGraph } from './RelationsGraph';
import { RelationsPageHeader } from './RelationsPageHeader';
import { RelationsPageSkeleton } from './RelationsPageSkeleton';
import { FranchiseContentType, GraphNode } from '@/types';

const parseContentPath = (pathname: string): { contentType: FranchiseContentType; slug: string } | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const [type, ...slugParts] = segments;
    if (type !== 'anime' && type !== 'manga') return null;

    return { contentType: type, slug: slugParts.join('/') };
};

const RelationsPageComponent: React.FC = () => {
    const parsed = useMemo(() => parseContentPath(window.location.pathname), []);

    const { nodes, edges, loading, error } = useContentRelations({
        contentType: parsed?.contentType ?? 'anime',
        slug: parsed?.slug ?? '',
    });

    const currentNode = useMemo<GraphNode | null>(() => {
        if (!parsed) return null;
        return nodes.find(n => n.type === parsed.contentType && n.slug === parsed.slug) ?? null;
    }, [nodes, parsed]);

    const currentNodeId = currentNode?.id;

    if (!parsed) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <NotFound title="Помилка" description="Не вдалося визначити тайтл." />
            </main>
        );
    }

    if (loading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <RelationsPageSkeleton />
            </main>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <div className="flex flex-col gap-12">
                    <RelationsPageHeader
                        currentNode={currentNode}
                        slug={parsed.slug}
                        contentType={parsed.contentType}
                    />
                    <NotFound title="Помилка завантаження" description={error} />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <RelationsPageHeader
                    currentNode={currentNode}
                    slug={parsed.slug}
                    contentType={parsed.contentType}
                />

                <RelationsGraph nodes={nodes} edges={edges} currentNodeId={currentNodeId} />
            </div>
        </main>
    );
};

export default RelationsPageComponent;