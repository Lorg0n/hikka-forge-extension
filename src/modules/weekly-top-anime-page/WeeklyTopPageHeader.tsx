import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';

interface WeeklyTopPageHeaderProps {
    startDate?: string;
    endDate?: string;
}

const formatDateRange = (start: string, end: string): string => {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    const year = new Date(end).getFullYear();
    return `${fmt(start)} — ${fmt(end)} ${year}`;
};

export const WeeklyTopPageHeader: React.FC<WeeklyTopPageHeaderProps> = ({ startDate, endDate }) => {
    const now = new Date();
    const year = now.getFullYear();

    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-border/60 p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-bold text-base line-clamp-1">
                                Популярні онґоінґи
                            </h4>
                            {startDate && endDate && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md bg-info/10 text-info-foreground border border-info/20 whitespace-nowrap">
                                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                                    {formatDateRange(startDate, endDate)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Гарячі онґоінґи. Рейтинг базується на прирості нових оцінок за вказаний період.
                        </p>
                    </div>
                </div>

                <IconLinkButton
                    href={`/anime?page=1&statuses=ongoing&sort=score&order=desc&years=${year}&years=${year}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити список онґоінґів"
                    newTab
                />
            </div>
        </div>
    );
};
