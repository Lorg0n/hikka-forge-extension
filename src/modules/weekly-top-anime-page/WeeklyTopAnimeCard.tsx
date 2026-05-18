import React from 'react';
import Link from '@/components/typography/link';
import { WeeklyTopAnimeItem } from '@/types';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Image from '@/components/ui/image';

interface WeeklyTopAnimeCardProps {
    item: WeeklyTopAnimeItem;
    className?: string;
}

export const WeeklyTopAnimeCard: React.FC<WeeklyTopAnimeCardProps> = ({ item, className }) => {
    let rankChangeEl;

    if (item.previous_rank === null) {
        rankChangeEl = (
            <div className="flex items-center justify-center gap-0 text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary font-bold leading-none backdrop-blur-sm">
                NEW
            </div>
        );
    } else if (item.rank_change && item.rank_change > 0) {
        rankChangeEl = (
            <div className="flex items-center justify-center gap-0 text-xs text-success-foreground font-bold leading-none drop-shadow-sm">
                {/* <Icon icon="material-symbols:arrow-drop-up-rounded" className="size-5 -ml-1" /> */}
                {"▲ "}
                {item.rank_change}
            </div>
        );
    } else if (item.rank_change && item.rank_change < 0) {
        rankChangeEl = (
            <div className="flex items-center justify-center gap-0 text-xs text-destructive-foreground font-bold leading-none drop-shadow-sm">
                {/* <Icon icon="material-symbols:arrow-drop-down-rounded" className="size-5 -ml-1" /> */}
                {"▼ "}
                {Math.abs(item.rank_change)}
            </div>
        );
    } else {
        rankChangeEl = (
            <div className="flex items-center justify-center gap-0 text-xs text-muted-foreground font-bold leading-none h-5">
                <Icon icon="material-symbols:horizontal-rule-rounded" className="size-4" />
            </div>
        );
    }

    return (
        <Link
            href={`/anime/${item.slug}`}
            className={cn(
                "block group no-underline hover:no-underline outline-none",
                className
            )}
        >
            <Card className="p-0 relative overflow-hidden border-border shadow-sm rounded-lg group-hover:ring-2 group-hover:ring-primary/50 transition-all isolate">
                <div 
                    className="absolute inset-0 -z-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.poster})` }}
                />
                <div className="absolute inset-0 -z-10 bg-background/60 backdrop-blur-xl" />

                <div className="relative z-10 flex flex-row p-3 sm:p-4 gap-3 sm:gap-4 items-center">
                    
                    <div className="flex flex-col items-center justify-center w-8 sm:w-8 shrink-0 gap-1">
                        <span className={cn(
                            "font-display text-xl sm:text-2xl font-bold leading-none drop-shadow-sm",
                            item.current_rank <= 3 ? "text-primary" : "text-foreground"
                        )}>
                            {item.current_rank}
                        </span>
                        {rankChangeEl}
                    </div>

                    <div className="w-12 sm:w-16 shrink-0 shadow-md">
                        <AspectRatio ratio={2 / 3} className="overflow-hidden rounded-md bg-secondary/20">
                            <Image
                                src={item.poster}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </AspectRatio>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 justify-center gap-1">
                        <h3 className="font-bold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug drop-shadow-sm">
                            {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground font-medium drop-shadow-sm">
                            <div className="flex items-center gap-1" title="Нових оцінок за період">
                                <Icon icon="material-symbols:person-add-rounded" className="size-3.5" />
                                <span>+{item.new_voters}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Приріст оцінок">
                                <Icon icon="material-symbols:trending-up-rounded" className="size-3.5" />
                                <span>{item.voter_growth_pct.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 ml-1 sm:ml-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/40 border border-border/50 transition-colors group-hover:bg-secondary/60 backdrop-blur-md">
                            <span className="font-display font-bold text-foreground text-sm leading-none pt-0.5">
                                {item.current_score ? item.current_score.toFixed(2) : "0.00"}
                            </span>
                            <Icon icon="material-symbols:star-rounded" className="text-primary-foreground size-4" />
                        </div>
                    </div>
                </div>

            </Card>
        </Link>
    );
};