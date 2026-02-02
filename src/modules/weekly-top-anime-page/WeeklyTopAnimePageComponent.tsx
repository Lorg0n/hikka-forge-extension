import React, { useMemo } from 'react';
import { WeeklyTopPageHeader } from './WeeklyTopPageHeader';
import { useWeeklyTopAnime } from '@/hooks/useWeeklyTopAnime';
import { WeeklyTopAnimeList } from './WeeklyTopAnimeList';
import { WeeklyTopAnimeSkeleton } from './WeeklyTopAnimeSkeleton';
import NotFound from '@/components/ui/not-found';

const WeeklyTopAnimePageComponent: React.FC = () => {
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); 

        let lastSunday;

        if (day === 0) {
            lastSunday = new Date(now);
        } else {
            lastSunday = new Date(now);
            lastSunday.setDate(now.getDate() - day);
        }

        const lastMonday = new Date(lastSunday);
        lastMonday.setDate(lastSunday.getDate() - 6);

        return {
            startDate: lastMonday.toISOString().split('T')[0],
            endDate: lastSunday.toISOString().split('T')[0]
        };
    }, []);

    const {
        data,
        loading,
        error,
    } = useWeeklyTopAnime({
        startDate,
        endDate,
        initialPage: 0,
        initialSize: 10
    });

    if (loading && !data) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <WeeklyTopAnimeSkeleton />
            </main>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <div className="flex flex-col gap-12">
                    <WeeklyTopPageHeader />
                    <NotFound
                        title="Помилка завантаження"
                        description={error}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <div id="top-header">
                    <WeeklyTopPageHeader />
                </div>

                <WeeklyTopAnimeList
                    items={data?.content || []}
                    totalElements={data?.totalElements || 0}
                />
            </div>
        </main>
    );
};

export default WeeklyTopAnimePageComponent;