import React from 'react';
import { WeeklyTopAnimeItem } from '@/types';
import { WeeklyTopAnimeCard } from './WeeklyTopAnimeCard';
import NotFound from '@/components/ui/not-found';

interface WeeklyTopAnimeListProps {
    items: WeeklyTopAnimeItem[];
    totalElements: number;
}

export const WeeklyTopAnimeList: React.FC<WeeklyTopAnimeListProps> = ({ items, totalElements }) => {
    if (!items || items.length === 0) {
        return (
             <NotFound
                title="Дані відсутні"
                description="Не вдалося знайти рейтинг за цей період."
            />
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Список ({totalElements})</h3>
            </div>

            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <WeeklyTopAnimeCard key={item.slug} item={item} />
                ))}
            </div>
        </section>
    );
};