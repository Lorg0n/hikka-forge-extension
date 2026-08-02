import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import {
    fetchFranchiseGraph,
    FranchiseGraphRequestError,
} from '@/services/animeService';
import type { FranchiseContentType } from '@/types';

const parseContentPath = (pathname: string): { contentType: FranchiseContentType; slug: string } | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const [type, ...slugParts] = segments;
    if (type !== 'anime' && type !== 'manga') return null;

    return { contentType: type, slug: slugParts.join('/') };
};

const ContentRelationsButton: React.FC = () => {
    const parsed = parseContentPath(window.location.pathname);
    const [available, setAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        setAvailable(null);

        if (!parsed) {
            setAvailable(false);
            return () => {
                cancelled = true;
            };
        }

        void fetchFranchiseGraph(parsed)
            .then(() => {
                if (!cancelled) setAvailable(true);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setAvailable(
                    error instanceof FranchiseGraphRequestError && error.status === 404
                        ? false
                        : true,
                );
            });

        return () => {
            cancelled = true;
        };
    }, [parsed?.contentType, parsed?.slug]);

    if (!parsed) return null;

    const href = `/${parsed.contentType}/${parsed.slug}#related`;
    const title = available === null
        ? 'Перевірка пов’язаного контенту…'
        : available
            ? "Відкрити сторінку пов'язаного"
            : 'Пов’язаний контент відсутній';

    const icon = (
        <Icon icon="material-symbols:account-tree-outline" className="text-lg" />
    );

    if (!available) {
        return (
            <Button
                size="icon-sm"
                variant="outline"
                className="text-muted-foreground"
                disabled
                title={title}
                aria-label={title}
            >
                {icon}
            </Button>
        );
    }

    return (
        <Button
            size="icon-sm"
            variant="outline"
            className="text-muted-foreground"
            asChild
            title={title}
        >
            <a href={href} aria-label={title}>
                {icon}
            </a>
        </Button>
    );
};

export default ContentRelationsButton;
