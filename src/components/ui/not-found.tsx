'use client';

import { PropsWithChildren, ReactNode } from 'react';

import P from '@/components/typography/p';

import { Icon } from '@iconify/react';

interface Props extends PropsWithChildren {
    title: string | ReactNode;
    description?: string | ReactNode;
}

const Component = ({ title, description, children }: Props) => {
    return (
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-secondary/20 p-6 lg:flex-row">
            <div className="flex items-center gap-4">
                <Icon icon="material-symbols:feature-search" className="text-4xl text-muted-foreground" />
                <div className="flex flex-1 flex-col gap-1">
                    <h3 className="text-xl font-bold">{title}</h3>
                    {description && (
                        <P className="text-sm text-muted-foreground">
                            {description}
                        </P>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
};

export default Component;