import React from 'react';
import { WeeklyTopAnimeItem } from '@/types';
import { WeeklyTopAnimeCard } from './WeeklyTopAnimeCard';
import NotFound from '@/components/ui/not-found';
import { SectionHeader } from '@/components/ui/section-header';

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
            <SectionHeader title={`Список (${totalElements})`} />

            <div className="flex flex-col gap-4">
                {items.map((item) => (
                    <WeeklyTopAnimeCard key={item.slug} item={item} />
                ))}
            </div>
        </section>
    );
};
