import React, { useMemo } from 'react';
import { useContentRelations } from '@/hooks/useContentRelations';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import { RelationsGraph } from './RelationsGraph';
import { Icon } from '@iconify/react';

const parseContentPath = (pathname: string): { contentType: 'anime' | 'manga'; slug: string } | null => {
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

    const currentNodeId = useMemo(() => {
        if (!parsed) return undefined;
        const node = nodes.find(n => n.type === parsed.contentType && n.slug === parsed.slug);
        return node?.id;
    }, [nodes, parsed]);

    if (!parsed) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl mb-16">
                <NotFound title="Помилка" description="Не вдалося визначити тайтл." />
            </main>
        );
    }

    if (loading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl mb-16">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon icon="material-symbols:account-tree-outline" className="text-xl" />
                        <h2 className="text-xl font-semibold">Пов'язане</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <AspectRatio ratio={2 / 3}>
                                    <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse" />
                                </AspectRatio>
                                <div className="h-3 w-2/3 bg-secondary/20 rounded animate-pulse" />
                                <div className="h-3 w-full bg-secondary/20 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl mb-16">
                <NotFound title="Помилка завантаження" description={error} />
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl mb-16">
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-2">
                    <Icon icon="material-symbols:account-tree-outline" className="text-xl text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Пов'язане</h2>
                </div>

                <RelationsGraph nodes={nodes} edges={edges} currentNodeId={currentNodeId} />
            </div>
        </main>
    );
};

export default RelationsPageComponent;
