import { Icon } from "@iconify/react";
import React, { useMemo } from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ResponsiveContentRail } from '@/components/ui/responsive-content-rail';
import { SectionHeader } from '@/components/ui/section-header';
import { parseMediaPlusRoute } from '@/modules/media-plus/mediaPlusRoute';
import { useCommunityMedia } from '@/modules/media-plus/useCommunityMedia';

const gridClassName = 'no-scrollbar grid w-full min-w-0 grid-flow-col auto-cols-[minmax(11rem,calc((100%_-_1rem)/2))] gap-4 overflow-x-auto overscroll-x-contain pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:overflow-visible md:pb-0';
const pageGridClassName = 'grid w-full grid-cols-2 gap-4 sm:grid-cols-3';

interface MangaMediaPlusComponentProps {
    /** Full-page layout: cards only, without the inline section header and tab. */
    page?: boolean;
}

const MangaMediaPlusComponent: React.FC<MangaMediaPlusComponentProps> = ({ page = false }) => {
    const route = useMemo(parseMediaPlusRoute, []);
    const mangaRoute = route?.contentType === 'manga' ? route : null;
    const { items, loading, error } = useCommunityMedia(mangaRoute);

    // The manga page has no native media section. Do not reserve any space
    // until the public API confirms that community media actually exists.
    if (loading || error || items.length === 0) return null;

    const cards = items.slice(0, 3).map((item) => (
        <article key={item.id} className="flex min-w-0 flex-col gap-2">
            <AspectRatio ratio={1.7} className="overflow-hidden rounded-md bg-muted ring-1 ring-border">
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-secondary/20"
                >
                    {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="size-full object-cover" />
                    ) : <span className="text-sm text-muted-foreground">Відео</span>}
                </a>
            </AspectRatio>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0">
                <p className="mb-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground" title="Джерело"><Icon icon="lucide:graph-ring" className="size-3 shrink-0" aria-hidden="true" /><span className="sr-only">Джерело: </span><span className="truncate">{item.provider}</span></p>
                <span className="line-clamp-2 text-sm leading-5 font-medium">{item.title}</span>
            </a>
        </article>
    ));

    if (page) {
        return <div className={pageGridClassName}>{cards}</div>;
    }

    return (
        <section className="flex min-w-0 flex-col gap-5">
            <div className="flex min-h-8 items-center gap-3">
                <SectionHeader title="Медіа" href="#fan-media" className="flex-none" />
                <div
                    role="tablist"
                    aria-label="Медіа"
                    className="inline-flex w-fit items-center justify-center rounded-md bg-muted p-0.75 text-muted-foreground"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected="true"
                        data-active=""
                        className="inline-flex h-6 items-center justify-center rounded-md border border-primary-foreground/40 bg-[color-mix(in_srgb,var(--primary-foreground)_15%,var(--background))] px-3 py-0 text-xs font-medium text-primary-foreground"
                    >
                        Фанатське
                    </button>
                </div>
            </div>

            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
                <ResponsiveContentRail>
                    {({ scrollRef }) => (
                        <div ref={scrollRef} className={`${gridClassName} px-4 md:px-0`}>
                            {cards}
                        </div>
                    )}
                </ResponsiveContentRail>
            </div>
        </section>
    );
};

export default MangaMediaPlusComponent;
