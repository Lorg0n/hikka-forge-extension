import React, { useEffect, useRef, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityMediaThumbnailProps {
    src?: string | null;
    url: string;
    platform: string;
    alt: string;
    className?: string;
}

export const CommunityMediaThumbnail: React.FC<CommunityMediaThumbnailProps> = ({ src, alt, url, platform, className = '' }) => {
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);
    let videoId: string | null = null;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        if (platform.toUpperCase() === 'YOUTUBE' && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
            if (host === 'youtu.be') videoId = parsed.pathname.split('/')[1] || null;
            else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
                const parts = parsed.pathname.split('/');
                videoId = parts[1] === 'shorts' || parts[1] === 'embed' ? parts[2] : parsed.searchParams.get('v');
            }
        }
    } catch { /* Invalid URLs cannot be embedded. */ }
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) videoId = null;

    useEffect(() => setLoaded(false), [src]);

    return (
        <div className="relative">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
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
        </a>
        {videoId && <>
            <Button type="button" variant="secondary" size="icon-sm" onClick={() => setOpen(true)} aria-label={`Переглянути ${alt}`} className="absolute right-2 top-2 opacity-60 hover:bg-primary hover:opacity-90 focus-visible:opacity-100">
                <Icon icon="lucide:circle-fading-play" className="text-white" aria-hidden="true" />
            </Button>
            <dialog ref={dialogRef} onClose={() => setOpen(false)} onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
            }} aria-label={alt} className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-lg border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/60 backdrop:backdrop-blur-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold">{alt}</h2>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Закрити">
                        <Icon icon="lucide:x" className="size-5" aria-hidden="true" />
                    </Button>
                </div>
                {open && <iframe className="aspect-video w-full rounded-md" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={alt} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
            </dialog>
        </>}
        </div>
    );
};
