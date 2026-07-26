import React, { useEffect, useState } from 'react';
import { useSimilarManga } from '@/hooks/useSimilarManga';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import { ConnectedSimilarMangaCard } from '@/components/ui/manga/connected-similar-manga-card';
import { SimilarMangaHeader } from './SimilarMangaHeader';
import { ModuleListTransition, ModuleTransition } from '@/components/ui/module-transition';

const SimilarMangaComponent: React.FC = () => {
    const slug = typeof window !== 'undefined' ? window.location.pathname.split('/manga/')[1] : '';
    const { data, loading, error, refresh } = useSimilarManga({ slug, initialSize: 5 });
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
    
    const similarMangaList = data?.content?.filter(item => !hiddenItems.has(item.slug)) || [];

    useEffect(() => {
        console.log('[Hikka Forge][debug] similar manga render', {
            loading,
            error,
            itemCount: similarMangaList.length,
            slug,
        });
    }, [loading, error, similarMangaList.length, slug]);

    useEffect(() => {
        console.log('[Hikka Forge][debug] similar manga mounted');
        return () => console.log('[Hikka Forge][debug] similar manga unmounted');
    }, []);

    const handleFeedbackSuccess = (itemSlug: string) => {
        // Optionally refresh data after feedback
        refresh();
    };

    if (loading) {
        return (
            <ModuleTransition stateKey="loading" animateStateChanges={false}>
            <div className="flex flex-col gap-8">
                <SimilarMangaHeader />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <AspectRatio ratio={2 / 3}>
                                <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse"></div>
                            </AspectRatio>
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-secondary/20 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </ModuleTransition>
        );
    }

    if (error || similarMangaList.length === 0) {
        return (
            <ModuleTransition stateKey={error ? "error" : "empty"} animateStateChanges={false}>
            <div className="flex flex-col gap-8">
                <SimilarMangaHeader />
                <NotFound
                    title="Схожої манґи не знайдено"
                    description={error ? 'Не вдалося завантажити схожу манґу.' : 'На жаль, ми не змогли підібрати схожі тайтли.'}
                />
            </div>
            </ModuleTransition>
        );
    }

    return (
        <ModuleTransition stateKey="content" animateStateChanges={false}>
        <div className="flex flex-col gap-8">
            <SimilarMangaHeader />
            <ModuleListTransition className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                {similarMangaList.map((manga) => (
                    <ConnectedSimilarMangaCard 
                        key={manga.slug} 
                        manga={manga}
                        contextSlug={slug}
                        onFeedbackSuccess={() => handleFeedbackSuccess(manga.slug)}
                    />
                ))}
            </ModuleListTransition>
        </div>
        </ModuleTransition>
    );
};

export default SimilarMangaComponent;
