import React from 'react';
import Link from '@/components/typography/link';
import { WeeklyTopAnimeItem } from '@/types';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface WeeklyTopAnimeCardProps {
    item: WeeklyTopAnimeItem;
    className?: string;
}

export const WeeklyTopAnimeCard: React.FC<WeeklyTopAnimeCardProps> = ({ item, className }) => {
    let rankChangeEl = null;
    if (item.rankChange > 0) {
        rankChangeEl = <span className="text-xs text-completed-foreground font-bold ml-1">▲{item.rankChange}</span>;
    } else if (item.rankChange < 0) {
        rankChangeEl = <span className="text-xs text-dropped-foreground font-bold ml-1">▼{Math.abs(item.rankChange)}</span>;
    } else {
        rankChangeEl = <span className="text-xs text-muted-foreground ml-1">-</span>;
    }

    return (
        <Link
            href={`/anime/${item.slug}`}
            className={cn(
                "group relative w-full h-16 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 no-underline",
                className
            )}
        >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
                    }}
                />
            </div>

            {/* Content Container */}
            <div className="relative flex items-center justify-between h-full px-4 gap-4 w-full">

                {/* Left: Rank Badge */}
                <div className="flex items-center gap-2 min-w-[3.5rem]">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded bg-white/10 backdrop-blur-md font-bold text-white shadow-sm",
                        item.currentRank <= 3 && "bg-primary/80 text-primary-foreground" // Highlight top 3
                    )}>
                        {item.currentRank}
                    </div>
                </div>

                {/* Center: Title */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-white text-base truncate leading-tight drop-shadow-md">
                        {item.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-300">
                        <span>Rank Change:</span>
                        {rankChangeEl}
                    </div>
                </div>

                {/* Right: Score Badge */}
                <div className="flex items-center justify-center px-2 py-1 h-8 rounded bg-white/10 backdrop-blur-md text-white font-semibold gap-1 min-w-[4rem] shadow-sm">
                    <span>{item.currentScore.toFixed(2)}</span>
                    <Star className="size-3 fill-white text-white" />
                </div>
            </div>
        </Link>
    );
};