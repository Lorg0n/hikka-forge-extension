import React from 'react';
import Link from '@/components/typography/link';
import { IconLinkButton } from '@/components/ui/icon-link-button';

interface UserCommentsPageHeaderProps {
    username: string;
    avatarUrl?: string;
}

export const UserCommentsPageHeader: React.FC<UserCommentsPageHeaderProps> = ({ username, avatarUrl }) => {
    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-border/60 p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                        <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-4">
                            <Link href={`/u/${username}`} className="hover:underline text-left">
                                <h4 className="font-bold text-base line-clamp-1">
                                    {username}
                                </h4>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">Профіль користувача</p>
                    </div>
                </div>

                <IconLinkButton
                    href={`/u/${username}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити профіль користувача"
                    newTab
                />
            </div>
        </div>
    );
};
