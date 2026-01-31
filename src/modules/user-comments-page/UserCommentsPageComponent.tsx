import React, { useEffect } from 'react';
import NotFound from '@/components/ui/not-found';
import { useUserComments } from '@/hooks/useUserComments';
import { UserCommentsPageHeader } from './UserCommentsPageHeader';
import { UserCommentsPageList } from './UserCommentsPageList';
import { UserCommentsPageSkeleton } from './UserCommentsPageSkeleton';
import { Pagination } from '@/components/ui/pagination'; 

const UserCommentsPageComponent: React.FC = () => {
    const username = typeof window !== 'undefined'
        ? window.location.pathname.split('/u/')[1]?.split('#')[0] || ''
        : '';

    const { 
        data: commentsData, 
        loading: commentsLoading, 
        error: commentsError,
        currentPage, 
        setPage,    
        sort,
        setSort,
    } = useUserComments({
        username,
        initialPage: 0,
        initialSize: 20, 
    });
    
    const avatarUrl = commentsData?.content?.[0]?.authorAvatarUrl;

    useEffect(() => {
        if (!commentsLoading && commentsData) {
            const headerElement = document.getElementById('comments-header');
            if (headerElement) {
                headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [currentPage, commentsLoading]);

    if (commentsLoading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <UserCommentsPageSkeleton />
            </main>
        );
    }
    
    if (commentsError || !commentsData || commentsData.content.length === 0) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                 <div className="flex flex-col gap-12 mt-12">
                    <UserCommentsPageHeader username={username} /> 
                    <NotFound
                        title="Не вдалося завантажити коментарі"
                        description={commentsError || 'Користувач ще не залишив жодного коментаря, або сталася помилка.'}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <div id="comments-header">
                    <UserCommentsPageHeader 
                        username={username}
                        avatarUrl={avatarUrl}
                    />
                </div>
                
                <UserCommentsPageList
                    items={commentsData.content} 
                    totalElements={commentsData.totalElements}
                    sort={sort}
                    onSortChange={setSort}
                />

                {commentsData.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination 
                            currentPage={currentPage + 1} 
                            totalPages={commentsData.totalPages}
                            onPageChange={(page) => setPage(page - 1)} 
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default UserCommentsPageComponent;