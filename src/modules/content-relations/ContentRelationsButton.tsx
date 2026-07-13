import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

const parseContentPath = (pathname: string): { contentType: string; slug: string } | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const [type, ...slugParts] = segments;
    if (type !== 'anime' && type !== 'manga') return null;

    return { contentType: type, slug: slugParts.join('/') };
};

const ContentRelationsButton: React.FC = () => {
    const parsed = parseContentPath(window.location.pathname);
    if (!parsed) return null;

    const href = `/${parsed.contentType}/${parsed.slug}#related`;

    return (
        <Button
            size="icon-sm"
            variant="ghost"
            asChild
            title="Відкрити сторінку пов'язаного"
        >
            <a href={href}>
                <Icon icon="material-symbols:account-tree-outline" className="text-lg" />
            </a>
        </Button>
    );
};

export default ContentRelationsButton;
