import React from 'react';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { CONTENT_TYPE, CONTENT_TYPE_URL, HIKKA_BASE } from '@/constants';

interface Comment {
    text: string;
    source_type: string;
    source_slug: string;
    total_replies: number;
    vote_score: number;
}

interface UserCommentCardProps {
    comment: Comment;
}

const getSourceURL = (sourceType: string, sourceSlug: string): string => {
    return `${HIKKA_BASE}/comments/${CONTENT_TYPE_URL[sourceType as keyof typeof CONTENT_TYPE_URL]}/${sourceSlug}`;
};

const getSourceName = (sourceType: string): string => {
    return `${CONTENT_TYPE[sourceType as keyof typeof CONTENT_TYPE]}`;
};

const UserCommentCard: React.FC<UserCommentCardProps> = ({ comment }) => {
    return (
        <Card className="flex flex-col md:w-1/3 bg-secondary/20 p-4 isolate rounded-lg justify-between">
            <MDViewer className="text-[0.9375rem] line-clamp-4">
                {comment.text}
            </MDViewer>
            <div className="flex flex-row justify-between items-center w-full">
                <Link href={getSourceURL(comment.source_type, comment.source_slug)}>
                    <Badge variant="secondary" className="rounded-lg cursor-pointer">
                        {getSourceName(comment.source_type)}
                    </Badge>
                </Link>
                <div className="flex flex-row gap-0">
                    {/* <Button
                        variant="ghost"
                        size="sm"
                        className="pointer-events-none gap-1 text-muted-foreground"
                    >
                        <Icon icon="tabler:message-filled" className="size-3" />
                        {comment.total_replies}
                    </Button> */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pointer-events-none gap-1 text-muted-foreground"
                    >
                        <Icon icon="bxs:upvote" className="size-3" />
                        {comment.vote_score}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default UserCommentCard;