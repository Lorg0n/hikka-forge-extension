import React from 'react';
import logo from '@/assets/logo.svg';
import { PageHeader } from '@/components/ui/page-header';
import { ChipTabs } from '@/components/ui/chip-tabs';
import { RecommendationContentType } from '@/types';

const CONTENT_TYPE_OPTIONS: {
    value: RecommendationContentType;
    label: string;
}[] = [
    { value: 'anime', label: 'Аніме' },
    { value: 'manga', label: 'Манґа' },
];

interface RecommendationsPageHeaderProps {
    avatarUrl?: string;
    username?: string;
    contentType?: RecommendationContentType;
    onContentTypeChange?: (contentType: RecommendationContentType) => void;
}

export const RecommendationsPageHeader: React.FC<
    RecommendationsPageHeaderProps
> = ({ avatarUrl, username, contentType, onContentTypeChange }) => {
    return (
        <PageHeader
            title="Персональні рекомендації"
            context={username || 'Hikka Forge'}
            description="Підібрано на основі вашого списку"
            media={
                avatarUrl || username ? (
                    <div className="relative w-full overflow-hidden rounded-(--base-radius) bg-muted aspect-square">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={username || 'User avatar'}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-bold text-primary-foreground">
                                {username?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-center rounded-(--base-radius) bg-primary/10 aspect-square">
                        <img src={logo} alt="Hikka Forge" className="size-7" />
                    </div>
                )
            }
            action={
                <img
                    src={logo}
                    alt="Hikka Forge"
                    className="size-5 shrink-0 opacity-60"
                />
            }
            tabs={
                contentType && onContentTypeChange ? (
                    <ChipTabs
                        options={CONTENT_TYPE_OPTIONS}
                        value={contentType}
                        onValueChange={onContentTypeChange}
                    />
                ) : undefined
            }
        />
    );
};
