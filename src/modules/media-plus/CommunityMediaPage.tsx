import { Icon } from "@iconify/react";
import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ModulePage } from '@/components/ui/module-page';
import { ModulePagination } from '@/components/ui/module-pagination';
import NotFound from '@/components/ui/not-found';
import { Skeleton } from '@/components/ui/skeleton';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';
import { useForgeMangaDetails } from '@/hooks/useForgeMangaDetails';
import { parseMediaPlusRoute } from './mediaPlusRoute';
import { useCommunityMedia } from './useCommunityMedia';
import { CommunityMediaThumbnail } from './CommunityMediaThumbnail';

const PAGE_SIZE = 24;

export const CommunityMediaPage: React.FC = () => {
    const route = useMemo(parseMediaPlusRoute, []);
    const [page, setPage] = useState(0);
    const anime = useForgeAnimeDetails({ slug: route?.contentType === 'anime' ? route.slug : '' });
    const manga = useForgeMangaDetails({ slug: route?.contentType === 'manga' ? route.slug : '' });
    const details = route?.contentType === 'anime' ? anime.data : manga.data;
    const { items, loading, error, totalPages } = useCommunityMedia(route, { page, size: PAGE_SIZE });
    const title = details?.titleUa || details?.titleEn || (route?.contentType === 'anime' ? 'Аніме' : 'Манґа');

    return <ModulePage stateKey="fan-media">
        <div className="flex flex-col gap-12">
            <PageHeader title="Фанатські медіа" context={title} contextHref={`/${route?.contentType}/${route?.slug}`} media={details?.imageUrl ? <div className="aspect-[0.7] w-full overflow-hidden rounded-(--base-radius) bg-muted"><img src={details.imageUrl} alt={title} className="size-full object-cover" /></div> : undefined} />
            {error ? <NotFound title="Не вдалося завантажити медіа" /> : loading ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">{Array.from({ length: items.length || PAGE_SIZE }).map((_, i) => <div key={i} className="flex min-w-0 flex-col gap-2"><Skeleton className="aspect-[1.7] w-full" /><Skeleton className="h-3 w-2/5" /><div className="flex flex-col gap-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>)}</div> : items.length === 0 ? <NotFound title="Фанатські медіа не знайдено" /> : <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col gap-2"><CommunityMediaThumbnail src={item.thumbnailUrl} alt={item.title} url={item.url} platform={item.platform} /><a href={item.url} target="_blank" rel="noopener noreferrer"><p className="mb-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground" title="Джерело"><Icon icon="lucide:graph-ring" className="size-3 shrink-0" aria-hidden="true" /><span className="sr-only">Джерело: </span><span className="truncate">{item.provider}</span></p><span className="line-clamp-2 text-sm leading-5 font-medium">{item.title}</span></a></article>)}</div>
            </>}
            {totalPages > 1 && <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </div>
    </ModulePage>;
};
