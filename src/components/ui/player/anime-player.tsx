import React, { useState, useCallback } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnimePlayerEmbedProps {
    iframeSrc?: string | null;
    title: string;
    invalidSourceMessage?: string;
}

const AnimePlayerEmbed: React.FC<AnimePlayerEmbedProps> = ({
    iframeSrc,
    title,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const isSrcPresent = !!iframeSrc;

    const handleLoad = useCallback(() => {
        if (iframeSrc) {
            setIsLoading(false);
            setHasError(false);
        }
    }, [iframeSrc]);


    const showLoadingOverlay = isLoading;
    const showNoSourceSkeleton = !isSrcPresent; 

    const placeholder = (): React.ReactElement => {
        return (
            <div className="absolute inset-0 z-10 flex p-4 items-end">
                <div className="flex items-center w-full gap-2">
                    <Skeleton className="h-4 w-4 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-10 rounded-md" />
                    <Skeleton className="h-4 w-4 rounded-md" />
                    <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                {/* <Skeleton className="absolute size-10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /> */}
            </div>
        );
    };

    return (
        <div className="relative w-full player-embed-container border rounded-md overflow-hidden bg-popover">
            <AspectRatio ratio={16 / 9} className="relative">
                {(
                    <iframe
                        key={iframeSrc} 
                        src={iframeSrc!}
                        title={title}
                        className={cn(
                            "absolute inset-0 w-full h-full border-0 z-0", 
                            (isLoading || hasError) && "opacity-0 pointer-events-none"
                        )}
                        onLoad={handleLoad}
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                        allowFullScreen
                    />
                )}

                {showLoadingOverlay && (
                    placeholder()
                )}

                {showNoSourceSkeleton && (
                    placeholder()
                )}
            </AspectRatio>
        </div>
    );
};

export default AnimePlayerEmbed;