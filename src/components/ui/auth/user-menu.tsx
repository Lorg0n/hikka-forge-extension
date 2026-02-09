import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UserMenuProps {
    onLoginClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick }) => {
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    if (isLoading) {
        return (
            <Skeleton className="h-8 w-8 rounded-full" />
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Button
                variant="outline"
                size="sm"
                asChild 
                className="gap-2 cursor-pointer"
            >
                <a
                    href="https://hikka.io/oauth?reference=8dca46ce-c233-4b5f-b895-8684c82c0f1d&scope=read:watchlist,read:readlist,read:user-details"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Увійти
                </a>
            </Button>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-secondary">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{user.username}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.hikkaRole}
                            </p>
                        </div>
                    </div>

                    {user.roles && user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                                <span
                                    key={role}
                                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="border-t pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={logout}
                            className="w-full gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Вийти
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};