import React from 'react';
import logo from '@/assets/logo.svg';

interface RecommendationsPageHeaderProps {
    avatarUrl?: string;
    username?: string;
}

export const RecommendationsPageHeader: React.FC<RecommendationsPageHeaderProps> = ({
    avatarUrl,
    username,
}) => {
    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm dark:border-border dark:bg-secondary/20">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-4">
                    {avatarUrl || username ? (
                        <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                            <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={username || 'User avatar'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                                        {username?.charAt(0).toUpperCase() ?? '?'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 shrink-0">
                            <img src={logo} alt="Hikka Forge" className="size-7" />
                        </div>
                    )}

                    <div className="flex flex-1 flex-col gap-1">
                        <h4 className="font-bold text-base line-clamp-1">
                            Персональні рекомендації
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Підібрано на основі вашого списку
                        </p>
                    </div>
                </div>

                <img src={logo} alt="Hikka Forge" className="size-5 shrink-0 opacity-60" />
            </div>
        </div>
    );
};