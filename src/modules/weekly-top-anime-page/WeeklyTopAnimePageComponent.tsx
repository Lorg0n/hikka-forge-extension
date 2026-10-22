import React, { useMemo } from 'react';
import { WeeklyTopPageHeader } from './WeeklyTopPageHeader';
import { useWeeklyTopAnime } from '@/hooks/useWeeklyTopAnime';
import { WeeklyTopAnimeList } from './WeeklyTopAnimeList';
import { WeeklyTopAnimeSkeleton } from './WeeklyTopAnimeSkeleton';
import NotFound from '@/components/ui/not-found';
import { ModulePage } from '@/components/ui/module-page';

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
            <ModulePage stateKey="loading">
                <WeeklyTopAnimeSkeleton />
            </ModulePage>
        );
    }

    if (error) {
        return (
            <ModulePage stateKey="error">
                <div className="flex flex-col gap-12">
                    <WeeklyTopPageHeader startDate={startDate} endDate={endDate} />
                    <NotFound
                        title="Помилка завантаження"
                        description={error}
                    />
                </div>
            </ModulePage>
        );
    }

    return (
        <ModulePage stateKey="content">
            <div className="flex flex-col gap-12">
                <div id="top-header">
                    <WeeklyTopPageHeader startDate={startDate} endDate={endDate} />
                </div>

                <WeeklyTopAnimeList
                    items={data?.content || []}
                    totalElements={data?.totalElements || 0}
                />
            </div>
        </ModulePage>
    );
};

export default WeeklyTopAnimePageComponent;
