import React, { useState } from 'react'; 
import { SimilarAnimeItem } from '@/types';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { FeedbackContextMenu } from '@/components/ui/feedback/feedback-popover';
import { useSimilarityFeedback } from '@/hooks/useSimilarityFeedback';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { cn } from '@/lib/utils';

interface SimilarAnimeCardWithContextMenuProps {
    anime: SimilarAnimeItem;
    contextSlug: string;
    onFeedbackSuccess?: () => void;
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) {
        return "Дуже схоже";
    }
    if (distance >= 0.65) {
        return "Схоже";
    }
    if (distance >= 0.5) {
        return "Слабо схоже";
    }
    return "Мало спільного";
};

const SimilarAnimeCardWithContextMenu: React.FC<SimilarAnimeCardWithContextMenuProps> = ({ 
    anime, 
    contextSlug,
    onFeedbackSuccess 
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hidden, setHidden] = useState(false);
    const { submitFeedback } = useSimilarityFeedback();
    const { isAuthenticated } = useAuth();

    const handleFeedback = async (positive: boolean) => {
        const success = await submitFeedback({
            targetSlug: anime.slug,
            contextSlug: contextSlug,
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
                "flex flex-col gap-2 transition-all duration-300",
                hidden && "opacity-0 scale-95"
            )}
        >
            <Link href={`/anime/${anime.slug}`}>
                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-lg">
                    <Image
                        src={anime.imageUrl}
                        alt={anime.title}
                        width={200}
                        height={300}
                        className={`
                            w-full h-full object-cover rounded-lg
                            transition-opacity duration-300 ease-in-out
                            ${isLoading ? 'opacity-0' : 'opacity-100'}
                        `}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </AspectRatio>
            </Link>
            <div>
                <p className="mb-1 truncate text-xs text-muted-foreground">
                    {getSimilarityText(anime.similarityScore)}
                </p>
                <p className="text-sm font-medium line-clamp-2">{anime.title}</p>
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

export default SimilarAnimeCardWithContextMenu;