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
import { Skeleton } from '../skeleton';
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

    return (
        <Card
            className={cn(
                'flex flex-col min-w-0 p-4 isolate rounded-lg justify-between gap-4',
                className
            )}
        >
            <MDViewer className="text-sm font-medium">
                {comment.text}
            </MDViewer>

            <div className="flex items-center justify-between w-full mt-auto gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                        <Link
                            href={contentUrl}
                            className="block w-8 h-24 sm:w-20 sm:h-28"
                        >
                            <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-sm">
                                {isImageAvailable ? (
                                    <Image
                                        src={comment.contentImageUrl!}
                                        alt={comment.contentTitle}
                                        className="w-full h-full object-cover rounded-sm"
                                        transitionDisabled
                                    />
                                ) : (
                                    <Skeleton className="w-full h-full rounded-sm" />
                                )}
                            </AspectRatio>
                        </Link>
                    </div>

                    <div className="min-w-0 flex flex-col">
                        <Link
                            href={contentUrl}
                            className="block truncate text-sm font-semibold
                         text-muted-foreground hover:text-foreground
                         transition-colors"
                        >
                            {comment.contentTitle}
                        </Link>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row gap-0 flex-shrink-0">
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
