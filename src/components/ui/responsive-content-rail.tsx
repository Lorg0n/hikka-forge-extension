import { useCallback, useEffect, useState, type ReactNode, type RefCallback } from 'react';
import { cn } from '@/lib/utils';

interface EdgeFades {
    left: boolean;
    right: boolean;
}

export interface ResponsiveContentRailProps {
    /**
     * Receives a ref for the element that owns horizontal scrolling. Its direct
     * children are used to determine whether either edge is visibly clipped.
     */
    children: (props: { scrollRef: RefCallback<HTMLDivElement> }) => ReactNode;
    /** Extend the mobile scroll viewport into the page gutter. */
    mobileBleed?: boolean;
    /** Classes applied to the rail viewport. */
    className?: string;
    /** Classes that control the fade colour and width. */
    fadeClassName?: string;
}

const DEFAULT_FADE_CLASS = 'w-16 from-background/85 via-background/40';

export const ResponsiveContentRail = ({
    children,
    mobileBleed = true,
    className,
    fadeClassName = DEFAULT_FADE_CLASS,
}: ResponsiveContentRailProps) => {
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [edgeFades, setEdgeFades] = useState<EdgeFades>({ left: false, right: false });
    const scrollRef = useCallback<RefCallback<HTMLDivElement>>((element) => {
        setScrollElement(element);
    }, []);

    useEffect(() => {
        if (!scrollElement) return;

        const updateEdgeFades = () => {
            const bounds = scrollElement.getBoundingClientRect();
            const tolerance = 1;
            const items = Array.from(scrollElement.children);
            const next = {
                left: items.some((item) => item.getBoundingClientRect().left < bounds.left - tolerance),
                right: items.some((item) => item.getBoundingClientRect().right > bounds.right + tolerance),
            };

            setEdgeFades((current) => (
                current.left === next.left && current.right === next.right ? current : next
            ));
        };

        const frame = requestAnimationFrame(updateEdgeFades);
        const resizeObserver = new ResizeObserver(updateEdgeFades);
        const mutationObserver = new MutationObserver(updateEdgeFades);

        resizeObserver.observe(scrollElement);
        Array.from(scrollElement.children).forEach((item) => resizeObserver.observe(item));
        mutationObserver.observe(scrollElement, { childList: true });
        scrollElement.addEventListener('scroll', updateEdgeFades, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            scrollElement.removeEventListener('scroll', updateEdgeFades);
        };
    }, [scrollElement]);

    return (
        <div className={cn('relative min-w-0', mobileBleed && '-mx-4 md:mx-0', className)}>
            {children({ scrollRef })}
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r to-transparent transition-opacity duration-300 ease-out md:hidden',
                    fadeClassName,
                    edgeFades.left ? 'opacity-100' : 'opacity-0',
                )}
            />
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l to-transparent transition-opacity duration-300 ease-out md:hidden',
                    fadeClassName,
                    edgeFades.right ? 'opacity-100' : 'opacity-0',
                )}
            />
        </div>
    );
};
