import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';

interface UserCommentsPageHeaderProps {
    username: string;
    avatarUrl?: string;
}

export const UserCommentsPageHeader: React.FC<UserCommentsPageHeaderProps> = ({ username, avatarUrl }) => {
    return (
        <PageHeader
            title={username}
            description="Профіль користувача"
            titleHref={`/u/${username}`}
            media={
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="size-full object-cover" />
                    ) : (
                        <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-bold text-primary-foreground">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            }
            action={
                <IconLinkButton
                    href={`/u/${username}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити профіль користувача"
                    newTab
                />
            }
        />
    );
};
