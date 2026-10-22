import React from 'react';
import NotFound from '@/components/ui/not-found';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { RecommendationsPageHeader } from './RecommendationsPageHeader';
import { RecommendationsPageGrid } from './RecommendationsPageGrid';
import { RecommendationsPageSkeleton } from './RecommendationsPageSkeleton';
import { Button } from '@/components/ui/button';
import { HIKKA_BASE } from '@/constants';
import { ModulePage } from '@/components/ui/module-page';
import { ModulePagination } from '@/components/ui/module-pagination';

const RecommendationsPageComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();

    const {
        data,
        loading: dataLoading,
        error,
        currentPage,
        contentType,
        setContentType,
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
            <ModulePage stateKey="unauthenticated">
                <div className="flex flex-col gap-12">
                    <RecommendationsPageHeader />
                    <NotFound
                        title="Увійдіть, щоб побачити рекомендації"
                        description="Персональні рекомендації доступні лише для авторизованих користувачів"
                    >
                        <Button
                            variant="default"
                            onClick={() =>
                                browser.tabs.create({
                                    url: `${HIKKA_BASE}/oauth?reference=8dca46ce-c233-4b5f-b895-8684c82c0f1d&scope=read:watchlist,read:readlist,read:user-details`,
                                })
                            }
                        >
                            Увійти
                        </Button>
                    </NotFound>
                </div>
            </ModulePage>
        );
    }

    if (isLoading && !data) {
        return (
            <ModulePage stateKey="loading">
                <RecommendationsPageSkeleton />
            </ModulePage>
        );
    }

    if (error || (!data && !isLoading)) {
        return (
            <ModulePage stateKey="error">
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
            </ModulePage>
        );
    }

    return (
        <ModulePage stateKey="content">
            <div className="flex flex-col gap-12">
                <RecommendationsPageHeader
                    avatarUrl={user?.avatar}
                    username={user?.username}
                />

                <RecommendationsPageGrid
                    items={data!.content}
                    totalElements={data!.totalElements}
                    contentType={contentType}
                    onContentTypeChange={setContentType}
                    onFeedbackSuccess={refresh}
                />

                {data && (
                    <ModulePagination
                        page={currentPage}
                        totalPages={data.totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </ModulePage>
    );
};

export default RecommendationsPageComponent;
import browser from '@/utils/browser';
