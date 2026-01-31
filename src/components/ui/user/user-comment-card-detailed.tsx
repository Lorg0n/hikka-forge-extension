import React from 'react';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { CommentItem } from '@/types';
import { CONTENT_TYPE_URL, HIKKA_BASE } from '@/constants';
import { cn, formatTimeAgo } from '@/lib/utils';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import Image from '@/components/ui/image';

interface UserCommentCardDetailedProps {
    comment: CommentItem;
    className?: string;
}

const UserCommentCardDetailed: React.FC<UserCommentCardDetailedProps> = ({
    comment,
    className,
}) => {
    const contentUrl = `${HIKKA_BASE}/${CONTENT_TYPE_URL[comment.contentType]}/${comment.contentSlug}`;
    const isImageAvailable = !!comment.contentImageUrl;

    const title =
        comment.contentType === 'edit' && !comment.contentTitle
            ? `Правка ${comment.contentSlug}`
            : comment.contentTitle;

    return (
        <Card
            className={cn(
                'flex flex-col min-w-0 p-4 isolate rounded-lg gap-8',
                className
            )}
        >
            <MDViewer className="text-sm font-medium">
                {comment.text}
            </MDViewer>

            <div className="mt-auto flex w-full items-end justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    {isImageAvailable && (
                        <div className="flex-shrink-0">
                            <Link
                                href={contentUrl}
                                className="block w-8 h-24 sm:w-20 sm:h-28"
                            >
                                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-sm">
                                    <Image
                                        src={comment.contentImageUrl!}
                                        alt={comment.contentTitle}
                                        className="h-full w-full object-cover rounded-sm"
                                        transitionDisabled
                                    />
                                </AspectRatio>
                            </Link>
                        </div>
                    )}

                    <div className="min-w-0 flex flex-col justify-end">
                        <Link
                            href={contentUrl}
                            className="block truncate text-sm font-semibold
                                text-muted-foreground hover:text-foreground
                                transition-colors"
                        >
                            {title}
                        </Link>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-shrink-0 items-end gap-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pointer-events-none gap-1 text-muted-foreground"
                    >
                        <Icon icon="bxs:upvote" className="size-3" />
                        {comment.voteScore}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="pointer-events-none gap-1 text-muted-foreground"
                    >
                        <Icon icon="iconamoon:comment-fill" className="size-3" />
                        {comment.totalReplies}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default UserCommentCardDetailed;
