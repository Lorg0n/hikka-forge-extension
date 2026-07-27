import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { SimilarContentItem, SimilarContentType } from '@/types';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface SimilarContentCardProps {
    item: SimilarContentItem;
    contentType: SimilarContentType;
    className?: string;
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return 'Дуже схоже';
    if (distance >= 0.65) return 'Схоже';
    if (distance >= 0.5) return 'Слабо схоже';
    return 'Мало спільного';
};

export const SimilarContentCard: React.FC<SimilarContentCardProps> = ({
    item,
    contentType,
    className,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const href = `/${contentType}/${item.slug}`;

    return (
        <div className={cn('flex flex-col gap-2 group', className)}>
            <Link href={href} className="block">
                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-lg overflow-hidden">
                    <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={200}
                        height={300}
                        className={cn(
                            'w-full h-full object-cover transition-opacity duration-300',
                            isLoading ? 'opacity-0' : 'opacity-100',
                        )}
                        onLoad={() => {
                            logger.log('[Hikka Forge][debug] similar content image loaded', {
                                slug: item.slug,
                                contentType,
                                imageUrl: item.imageUrl,
                            });
                            setIsLoading(false);
                        }}
                        onError={() => {
                            logger.log('[Hikka Forge][debug] similar content image failed', {
                                slug: item.slug,
                                contentType,
                                imageUrl: item.imageUrl,
                            });
                            setIsLoading(false);
                        }}
                    />
                </AspectRatio>
            </Link>
            <div>
                <p className="mb-1 truncate text-xs text-muted-foreground">
                    {getSimilarityText(item.similarityScore)}
                </p>
                <Link
                    href={href}
                    className="text-sm font-medium line-clamp-2 text-card-foreground hover:text-card-foreground transition-colors"
                >
                    {item.title}
                </Link>
            </div>
        </div>
    );
};
