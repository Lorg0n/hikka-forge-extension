import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { ModulePageTransition } from './module-page-transition';

type ModulePageWidth = 'content' | 'wide';

interface ModulePageProps extends PropsWithChildren {
    /** A stable key for the current page state: loading, error, content, etc. */
    stateKey: string;
    width?: ModulePageWidth;
    className?: string;
}

const widthClasses: Record<ModulePageWidth, string> = {
    content: 'container max-w-3xl',
    wide: 'w-full max-w-[87.5rem]',
};

/**
 * Shared frame for full-page Forge modules.
 *
 * It keeps the transition, responsive gutters, and vertical rhythm consistent
 * while each module owns only its content and state-specific UI.
 */
export function ModulePage({
    stateKey,
    width = 'content',
    className,
    children,
}: ModulePageProps) {
    return (
        <ModulePageTransition stateKey={stateKey}>
            <main
                className={cn(
                    'mx-auto mt-8 mb-16 px-4 lg:mt-16',
                    widthClasses[width],
                    className,
                )}
            >
                {children}
            </main>
        </ModulePageTransition>
    );
}
