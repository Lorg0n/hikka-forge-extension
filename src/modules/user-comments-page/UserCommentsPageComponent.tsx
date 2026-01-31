import React from 'react';
import NotFound from '@/components/ui/not-found';
import { useUserComments } from '@/hooks/useUserComments';
import { UserCommentsPageHeader } from './UserCommentsPageHeader';
import { UserCommentsPageGrid } from './UserCommentsPageGrid';
import { UserCommentsPageSkeleton } from './UserCommentsPageSkeleton';

const UserCommentsPageComponent: React.FC = () => {
    // Extract username from URL, removing the #hash part
    const username = typeof window !== 'undefined'
        ? window.location.pathname.split('/u/')[1]?.split('#')[0] || ''
        : '';

    const { 
        data: commentsData, 
        loading: commentsLoading, 
        error: commentsError 
    } = useUserComments({
        username,
        initialPage: 0,
        initialSize: 30, // Load a larger number of items for a full page view
    });

    // To avoid an extra API call, we can get the avatar from the first comment
    const avatarUrl = commentsData?.content?.[0]?.authorAvatarUrl;

    // Show skeleton during the initial load
    if (commentsLoading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl">
                <UserCommentsPageSkeleton />
            </main>
        );
    }
    
    // Show a not-found/error message if data fetching fails or there are no comments
    if (commentsError || !commentsData || commentsData.content.length === 0) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-5xl">
                 <div className="flex flex-col gap-12 mt-12">
                    {/* Render a header even on error so the user has context for the page */}
                    <UserCommentsPageHeader username={username} /> 
                    <NotFound
                        title="Не вдалося завантажити коментарі"
                        description={commentsError || 'Користувач ще не залишив жодного коментаря, або сталася помилка.'}
                    />
                </div>
            </main>
        );
    }

    // Render the full page with header and grid on success
    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
            <div className="flex flex-col gap-12">
                <UserCommentsPageHeader 
                    username={username}
                    avatarUrl={avatarUrl}
                />
                
                <UserCommentsPageGrid 
                    items={commentsData.content} 
                    totalElements={commentsData.totalElements} 
                />
            </div>
        </main>
    );
};

export default UserCommentsPageComponent;