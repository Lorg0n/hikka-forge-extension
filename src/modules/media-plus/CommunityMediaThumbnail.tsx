import React, { useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityMediaThumbnailProps {
    src?: string;
    alt: string;
    className?: string;
}

export const CommunityMediaThumbnail: React.FC<CommunityMediaThumbnailProps> = ({ src, alt, className = '' }) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => setLoaded(false), [src]);

    return (
        <AspectRatio ratio={1.7} className={`relative overflow-hidden rounded-md bg-muted ring-1 ring-border ${className}`}>
            {src && (
                <>
                    {!loaded && <Skeleton className="absolute inset-0 size-full rounded-none" />}
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={() => setLoaded(true)}
                        className={`size-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                </>
            )}
            {!src && <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Відео</span>}
        </AspectRatio>
    );
};
