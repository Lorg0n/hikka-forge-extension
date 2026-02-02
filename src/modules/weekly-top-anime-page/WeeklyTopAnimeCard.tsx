import React from 'react';
import Link from '@/components/typography/link';
import { WeeklyTopAnimeItem } from '@/types';
import { cn } from '@/lib/utils';

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
        rankChangeEl = <span className="text-xs text-muted-foreground ml-1">—</span>;
    }

    return (
        <Link
            href={`/anime/${item.slug}`}
            className={cn(
                "group relative w-full h-16 rounded-lg overflow-hidden border border-border/50 transition-all duration-300 no-underline",
                "hover:no-underline",
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
                        background: 'linear-gradient(to right, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0) 100%)'
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
                        {rankChangeEl}
                    </div>
                </div>

                {/* Right: Score Badge */}
                <div className="bg-secondary/60 flex items-center gap-1 rounded-md border px-2 backdrop-blur">
                    <div className="font-display text-white font-bold">
                        {item.currentScore.toFixed(2)}
                    </div>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                        className="text-lg text-primary-foreground"
                    >
                        <path
                            fill="currentColor"
                            d="m12 17.275l-4.15 2.5q-.275.175-.575.15t-.525-.2t-.35-.437t-.05-.588l1.1-4.725L3.775 10.8q-.25-.225-.312-.513t.037-.562t.3-.45t.55-.225l4.85-.425l1.875-4.45q.125-.3.388-.45t.537-.15t.537.15t.388.45l1.875 4.45l4.85.425q.35.05.55.225t.3.45t.038.563t-.313.512l-3.675 3.175l1.1 4.725q.075.325-.05.588t-.35.437t-.525.2t-.575-.15z"
                        />
                    </svg>
                </div>
            </div>
        </Link>
    );
};