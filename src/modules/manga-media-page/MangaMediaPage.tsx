import React, { useMemo } from 'react';

import { PageHeader } from '@/components/ui/page-header';
import { ModulePage } from '@/components/ui/module-page';
import { useForgeMangaDetails } from '@/hooks/useForgeMangaDetails';
import MangaMediaPlusComponent from '@/modules/manga-media-plus/MangaMediaPlusComponent';
import { parseMediaPlusRoute } from '@/modules/media-plus/mediaPlusRoute';

/** Standalone fan-media route for manga, matching the #similar page pattern. */
const MangaMediaPage: React.FC = () => {
    const route = useMemo(parseMediaPlusRoute, []);
    const { data } = useForgeMangaDetails({ slug: route?.slug ?? '' });
    const title = data?.titleUa || data?.titleEn || 'Манґа';

    return (
        <ModulePage stateKey="manga-fan-media">
            <div className="flex flex-col gap-12">
                <PageHeader
                    title="Фанатські медіа"
                    context={title}
                    contextHref={`/manga/${route?.slug ?? ''}`}
                    media={data?.imageUrl ? (
                        <div className="aspect-[0.7] w-full overflow-hidden rounded-(--base-radius) bg-muted">
                            <img src={data.imageUrl} alt={title} className="size-full object-cover" />
                        </div>
                    ) : undefined}
                />
                <MangaMediaPlusComponent page />
            </div>
        </ModulePage>
    );
};

export default MangaMediaPage;
