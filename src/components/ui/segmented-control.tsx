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
            data-slot="tabs"
            data-orientation="horizontal"
            data-activation-direction="none"
            className={cn(
                'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
                className,
            )}
        >
            <div
                data-slot="tabs-list"
                data-variant="default"
                data-size={size}
                data-orientation="horizontal"
                data-activation-direction="none"
                role="tablist"
                aria-orientation="horizontal"
                className="group/tabs-list inline-flex w-full items-center justify-center rounded-md bg-muted p-0.75 text-muted-foreground"
            >
                {options.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            data-slot="tabs-trigger"
                            data-active={isActive ? '' : undefined}
                            data-orientation="horizontal"
                            data-activation-direction="none"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={option.label}
                            onClick={() => onValueChange(option.value)}
                            className={cn(
                                'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
                                'dark:text-muted-foreground dark:hover:text-foreground',
                                'data-[active]:border-primary-foreground/40 data-[active]:bg-[color-mix(in_srgb,var(--primary-foreground)_15%,var(--background))] data-[active]:text-primary-foreground data-[active]:hover:text-primary-foreground dark:data-[active]:hover:text-primary-foreground',
                                isActive && '!text-primary-foreground hover:!text-primary-foreground',
                                size === 'sm' && 'h-auto px-3 py-0.5 text-xs',
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { SegmentedControl };
export type { SegmentedControlOption, SegmentedControlProps };
