import React, { useMemo } from 'react';
import { useContentRelations } from '@/hooks/useContentRelations';
import NotFound from '@/components/ui/not-found';
import { RelationsGraph } from './RelationsGraph';
import { RelationsPageHeader } from './RelationsPageHeader';
import { RelationsPageSkeleton } from './RelationsPageSkeleton';
import { FranchiseContentType, GraphNode } from '@/types';
import { ModulePage } from '@/components/ui/module-page';

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
            <ModulePage stateKey="invalid" width="wide" className="mb-8">
                <NotFound title="Помилка" description="Не вдалося визначити тайтл." />
            </ModulePage>
        );
    }

    if (loading) {
        return (
            <ModulePage stateKey="loading" width="wide" className="mb-8">
                <RelationsPageSkeleton />
            </ModulePage>
        );
    }

    if (error) {
        return (
            <ModulePage stateKey="error" width="wide" className="mb-8">
                <div className="flex flex-col gap-8 lg:gap-10">
                    <RelationsPageHeader
                        currentNode={currentNode}
                        slug={parsed.slug}
                        contentType={parsed.contentType}
                    />
                    <NotFound title="Помилка завантаження" description={error} />
                </div>
            </ModulePage>
        );
    }

    return (
        <ModulePage stateKey="content" width="wide" className="mb-8">
            <div className="flex flex-col gap-8 lg:gap-10">
                <RelationsPageHeader
                    currentNode={currentNode}
                    slug={parsed.slug}
                    contentType={parsed.contentType}
                />

                <RelationsGraph nodes={nodes} edges={edges} currentNodeId={currentNodeId} />
            </div>
        </ModulePage>
    );
};

export default RelationsPageComponent;
