import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';

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
        <PageHeader
            title="Популярні онґоінґи"
            description="Гарячі онґоінґи. Рейтинг базується на прирості нових оцінок за вказаний період."
            titleSuffix={
                startDate && endDate ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-info/20 bg-info/10 px-2 py-0.5 text-xs font-medium text-info-foreground">
                        <span className="size-1.5 rounded-full bg-current opacity-70" />
                        {formatDateRange(startDate, endDate)}
                    </span>
                ) : undefined
            }
            action={
                <IconLinkButton
                    href={`/anime?page=1&statuses=ongoing&sort=score&order=desc&years=${year}&years=${year}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити список онґоінґів"
                    newTab
                />
            }
        />
    );
};
