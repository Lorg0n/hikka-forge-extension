import type { PropsWithChildren } from 'react';
import { ModuleTransition } from './module-transition';

interface ModulePageTransitionProps extends PropsWithChildren {
    stateKey: string;
}

/**
 * Keeps a full-page module's entrance animation stable while its state changes.
 * Loading, error, and content views replace in place instead of replaying the
 * page entrance animation.
 */
export function ModulePageTransition({
    stateKey,
    children,
}: ModulePageTransitionProps) {
    return (
        <ModuleTransition stateKey={stateKey} animateStateChanges={false}>
            {children}
        </ModuleTransition>
    );
}
