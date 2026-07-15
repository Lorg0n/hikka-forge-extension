import * as React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentedControlOption<T>[];
    value: T;
    onValueChange: (value: T) => void;
    className?: string;
    size?: 'sm' | 'md';
}

function SegmentedControl<T extends string>({
    options,
    value,
    onValueChange,
    className,
    size = 'sm',
}: SegmentedControlProps<T>) {
    return (
        <div
            role="group"
            className={cn(
                'flex items-center no-scrollbar overflow-y-scroll rounded-md p-0.75 bg-muted',
                className
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        data-state={isActive ? 'on' : 'off'}
                        role="radio"
                        aria-checked={isActive}
                        aria-label={option.label}
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            'inline-flex items-center justify-center gap-2 rounded-sm font-medium ring-offset-background transition-colors',
                            'hover:bg-muted hover:text-muted-foreground',
                            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            'disabled:pointer-events-none disabled:opacity-50',
                            'data-[state=on]:bg-background/40 data-[state=on]:text-secondary-foreground dark:text-muted-foreground',
                            '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                            'bg-transparent flex-1',
                            size === 'sm' ? 'px-3 py-0.5 text-xs' : 'px-4 py-1.5 text-sm',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export { SegmentedControl };
export type { SegmentedControlOption, SegmentedControlProps };