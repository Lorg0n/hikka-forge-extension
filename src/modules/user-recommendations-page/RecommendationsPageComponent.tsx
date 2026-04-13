import React from 'react';
import NotFound from '@/components/ui/not-found';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { RecommendationsPageHeader } from './RecommendationsPageHeader';
import { RecommendationsPageGrid } from './RecommendationsPageGrid';
import { RecommendationsPageSkeleton } from './RecommendationsPageSkeleton';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { HIKKA_BASE } from '@/constants';

const RecommendationsPageComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();

    const {
        data,
        loading: dataLoading,
        error,
        currentPage,
        setPage,
        refresh,
    } = useUserRecommendations({
        initialPage: 0,
        initialSize: 24,
    });

    const isLoading = authLoading || (isAuthenticated && dataLoading);

    // Not authenticated — prompt login
    if (!authLoading && !isAuthenticated) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <div className="flex flex-col gap-12">
                    <RecommendationsPageHeader />
                    <NotFound
                        title="Увійдіть, щоб побачити рекомендації"
                        description="Персональні рекомендації доступні лише для авторизованих користувачів"
                    >
                        <Button
                            variant="default"
                            onClick={() =>
                                chrome.tabs.create({
                                    url: `${HIKKA_BASE}/oauth?reference=8dca46ce-c233-4b5f-b895-8684c82c0f1d&scope=read:watchlist,read:readlist,read:user-details`,
                                })
                            }
                        >
                            Увійти
                        </Button>
                    </NotFound>
                </div>
            </main>
        );
    }

    if (isLoading && !data) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <RecommendationsPageSkeleton />
            </main>
        );
    }

    if (error || (!data && !isLoading)) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <div className="flex flex-col gap-12">
                    <RecommendationsPageHeader
                        avatarUrl={user?.avatar}
                        username={user?.username}
                    />
                    <NotFound
                        title="Не вдалося завантажити рекомендації"
                        description={
                            error ||
                            'Оцініть більше тайтлів, щоб ми могли підібрати щось для вас'
                        }
                    >
                        <Button variant="outline" onClick={refresh}>
                            Спробувати ще
                        </Button>
                    </NotFound>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <RecommendationsPageHeader
                    avatarUrl={user?.avatar}
                    username={user?.username}
                />

                <RecommendationsPageGrid
                    items={data!.content}
                    totalElements={data!.totalElements}
                    onFeedbackSuccess={refresh}
                />

                {data && data.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage + 1}
                            totalPages={data.totalPages}
                            onPageChange={(page) => setPage(page - 1)}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default RecommendationsPageComponent;