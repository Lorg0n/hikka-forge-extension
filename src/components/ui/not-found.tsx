'use client';

import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@iconify/react';

interface Props extends PropsWithChildren {
    title: string | ReactNode;
    description?: string | ReactNode;
}

const Component = ({ title, description, children }: Props) => {
    return (
        <div data-slot="empty" className="flex min-w-0 flex-1 flex-col items-center justify-center text-balance rounded-lg border-dashed text-center gap-4 p-6 md:p-8 border bg-secondary/20">
            <div data-slot="empty-header" className="flex max-w-sm flex-col items-center text-center gap-2">
                <div data-slot="empty-icon" data-variant="icon" className="mb-2 flex shrink-0 items-center justify-center rounded-lg bg-muted text-foreground size-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6">
                    <Icon icon="material-symbols:feature-search" />
                </div>
                <div data-slot="empty-title" className="font-medium tracking-tight text-base">
                    {title}
                </div>
                {description && (
                    <div data-slot="empty-description" className="text-muted-foreground [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4 text-sm">
                        {description}
                    </div>
                )}
            </div>
            {children && (
                <div data-slot="empty-content" className="flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Component;
