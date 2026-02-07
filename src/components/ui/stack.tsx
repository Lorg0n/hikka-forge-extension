import { ComponentPropsWithoutRef, FC } from 'react';
import { cn } from '@/lib/utils';

export type StackSize = 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface StackProps extends ComponentPropsWithoutRef<'div'> {
    extended?: boolean;
    size?: StackSize;
    extendedSize?: StackSize;
    gap?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<StackSize, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-4 md:grid-cols-6',
    7: 'grid-cols-5 md:grid-cols-7',
    8: 'grid-cols-6 md:grid-cols-8',
};

const EXTENDED_SIZES: Record<StackSize, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
    7: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-7',
    8: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-8',
};

const GAP_CLASSES = {
    sm: 'gap-2 lg:gap-4',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-4 lg:gap-8',
};

const Stack: FC<StackProps> = ({
    children,
    extended = false,
    size,
    extendedSize,
    gap = 'lg',
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                'relative grid',
                // Vertical margin and padding
                '-my-4 py-4',
                // Gap configuration
                GAP_CLASSES[gap],
                // Size configuration for standard layout
                size && SIZES[size],
                // Extended layout configuration
                extended
                    ? extendedSize
                        ? EXTENDED_SIZES[extendedSize]
                        : 'grid-cols-2 md:grid-cols-6'
                    : `no-scrollbar auto-cols-max grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:auto-cols-fr grid-flow-col overflow-x-auto snap-x`,
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Stack;