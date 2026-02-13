import React, { useState } from 'react';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RecommendationItem } from '@/types';
import { FeedbackContextMenu } from '@/components/ui/feedback/feedback-popover';
import { useRecommendationFeedback } from '@/hooks/useRecommendationFeedback';
import { useAuth } from '@/contexts/ModuleAuthContext';

interface RecommendationCardWithContextMenuProps {
    anime: RecommendationItem;
    className?: string;
    onFeedbackSuccess?: () => void;
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return "Обов'язково";
    if (distance >= 0.65) return "Варто";
    if (distance >= 0.5) return "Може";
    return "Спробуй";
};

const getSimilarityVariant = (distance: number): "success" | "warning" | "secondary" => {
    if (distance >= 0.9) return "success";
    if (distance >= 0.65) return "warning";
    return "secondary";
};

const RecommendationCardWithContextMenu: React.FC<RecommendationCardWithContextMenuProps> = ({ 
    anime, 
    className,
    onFeedbackSuccess
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hidden, setHidden] = useState(false);
    const { submitFeedback } = useRecommendationFeedback();
    const { isAuthenticated } = useAuth();

    const handleFeedback = async (positive: boolean) => {
        const success = await submitFeedback({
            targetSlug: anime.slug,
            positive
        });

        if (success) {
            if (!positive) {
                // Hide the card with animation if negative feedback
                setHidden(true);
                setTimeout(() => {
                    onFeedbackSuccess?.();
                }, 300);
            } else {
                onFeedbackSuccess?.();
            }
        }
    };

    if (hidden) {
        return null;
    }

    const cardContent = (
        <div 
            className={cn(
                "flex flex-col w-[120px] gap-2 transition-all duration-300",
                hidden && "opacity-0 scale-95",
                className
            )} 
            style={{ minWidth: '120px', maxWidth: '120px' }}
        >
            <Link href={`/anime/${anime.slug}`} className="relative block w-full mb-3">
                <div className="relative w-full" style={{ paddingBottom: '150%' }}>
                    <div className="absolute inset-0 bg-secondary/20 rounded-lg overflow-hidden">
                        <Image
                            src={anime.imageUrl}
                            alt={anime.title}
                            width={120}
                            height={180}
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover rounded-lg transition-all duration-300",
                                "group-hover:scale-105",
                                isLoading ? 'opacity-0' : 'opacity-100'
                            )}
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    </div>
                </div>
            </Link>

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 mt-auto">
                    <Badge
                        variant={getSimilarityVariant(anime.similarityScore)}
                        className="text-[10px] px-2 py-0 whitespace-nowrap flex-shrink-0"
                    >
                        {getSimilarityText(anime.similarityScore)}
                    </Badge>
                </div>

                <Link
                    href={`/anime/${anime.slug}`}
                    className="text-sm font-medium line-clamp-1"
                >
                    {anime.title}
                </Link>
            </div>
        </div>
    );

    // Only wrap with context menu if authenticated
    if (isAuthenticated) {
        return (
            <FeedbackContextMenu 
                onFeedback={handleFeedback}
            >
                {cardContent}
            </FeedbackContextMenu>
        );
    }

    return cardContent;
};

export default RecommendationCardWithContextMenu;