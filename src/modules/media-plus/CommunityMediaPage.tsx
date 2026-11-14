import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ModulePage } from '@/components/ui/module-page';
import { ModulePagination } from '@/components/ui/module-pagination';
import NotFound from '@/components/ui/not-found';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';
import { useForgeMangaDetails } from '@/hooks/useForgeMangaDetails';
import { parseMediaPlusRoute } from './mediaPlusRoute';
import { useCommunityMedia } from './useCommunityMedia';

const PAGE_SIZE = 24;

export const CommunityMediaPage: React.FC = () => {
    const route = useMemo(parseMediaPlusRoute, []);
    const [page, setPage] = useState(0);
    const anime = useForgeAnimeDetails({ slug: route?.contentType === 'anime' ? route.slug : '' });
    const manga = useForgeMangaDetails({ slug: route?.contentType === 'manga' ? route.slug : '' });
    const details = route?.contentType === 'anime' ? anime.data : manga.data;
    const { items, loading, error, totalPages } = useCommunityMedia(route, { page, size: PAGE_SIZE });
    const title = details?.titleUa || details?.titleEn || (route?.contentType === 'anime' ? 'Аніме' : 'Манґа');

    return <ModulePage stateKey={`fan-media-${page}`}>
        <div className="flex flex-col gap-12">
            <PageHeader title="Фанатські медіа" context={title} contextHref={`/${route?.contentType}/${route?.slug}`} media={details?.imageUrl ? <div className="aspect-[0.7] w-full overflow-hidden rounded-(--base-radius) bg-muted"><img src={details.imageUrl} alt={title} className="size-full object-cover" /></div> : undefined} />
            {error ? <NotFound title="Не вдалося завантажити медіа" /> : loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[1.7] animate-pulse rounded-md bg-secondary/20" />)}</div> : items.length === 0 ? <NotFound title="Фанатські медіа не знайдено" /> : <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col gap-2"><a href={item.url} target="_blank" rel="noopener noreferrer" className="aspect-[1.7] overflow-hidden rounded-md bg-muted ring-1 ring-border">{item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="size-full object-cover" />}</a><a href={item.url} target="_blank" rel="noopener noreferrer"><p className="mb-1 truncate text-xs text-muted-foreground">{item.provider}</p><span className="line-clamp-2 text-sm leading-5 font-medium">{item.title}</span></a></article>)}</div>
                <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>}
        </div>
    </ModulePage>;
};
