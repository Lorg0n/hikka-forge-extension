import React from 'react';
import { WeeklyTopAnimeItem } from '@/types';
import { WeeklyTopAnimeCard } from './WeeklyTopAnimeCard';
import NotFound from '@/components/ui/not-found';

interface WeeklyTopAnimeListProps {
    items: WeeklyTopAnimeItem[];
}

export const WeeklyTopAnimeList: React.FC<WeeklyTopAnimeListProps> = ({ items }) => {
    if (!items || items.length === 0) {
        return (
             <NotFound
                title="Дані відсутні"
                description="Не вдалося знайти рейтинг за цей період."
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {items.map((item) => (
                <WeeklyTopAnimeCard key={item.slug} item={item} />
            ))}
        </div>
    );
};
