import { cn } from '@/lib/utils';

interface ChipTabOption<T extends string> {
    value: T;
    label: string;
}

interface ChipTabsProps<T extends string> {
    options: ChipTabOption<T>[];
    value: T;
    onValueChange: (value: T) => void;
    className?: string;
}

/**
 * Horizontally scrollable page-navigation tabs, matching hikka.io's chip tabs.
 */
function ChipTabs<T extends string>({
    options,
    value,
    onValueChange,
    className,
}: ChipTabsProps<T>) {
    return (
        <div
            role="tablist"
            aria-orientation="horizontal"
            className={cn(
                'no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4',
                className,
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={option.label}
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                                ? 'border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground dark:hover:bg-primary-foreground/20'
                                : 'bg-secondary/40 text-muted-foreground hover:bg-accent',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export { ChipTabs };
export type { ChipTabOption, ChipTabsProps };
