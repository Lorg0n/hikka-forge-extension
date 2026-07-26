import React from 'react';
import logo from '@/assets/logo.svg';
import { PageHeader } from '@/components/ui/page-header';

interface RecommendationsPageHeaderProps {
    avatarUrl?: string;
    username?: string;
}

export const RecommendationsPageHeader: React.FC<RecommendationsPageHeaderProps> = ({
    avatarUrl,
    username,
}) => {
    return (
        <PageHeader
            title="Персональні рекомендації"
            description="Підібрано на основі вашого списку"
            media={
                avatarUrl || username ? (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
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
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <img src={logo} alt="Hikka Forge" className="size-7" />
                    </div>
                )
            }
            action={<img src={logo} alt="Hikka Forge" className="size-5 shrink-0 opacity-60" />}
        />
    );
};
