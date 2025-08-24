import React from 'react';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link'; 
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { CommentItem } from '@/types'; 
import { CONTENT_TYPE_URL, HIKKA_BASE } from '@/constants'; 
import { cn } from '@/lib/utils';

interface UserCommentCardProps {
  comment: CommentItem;
  className?: string;
}

const UserCommentCard: React.FC<UserCommentCardProps> = ({ comment, className }) => {
  const contentUrl = `${HIKKA_BASE}/${CONTENT_TYPE_URL[comment.contentType]}/${comment.contentSlug}`;

  return (
    <Card className={cn(
      "flex flex-col min-w-0 p-4 isolate rounded-lg justify-between gap-4",
      className
    )} >
      <MDViewer className="text-sm font-medium line-clamp-4">
        {comment.text}
      </MDViewer>

      <div className="flex flex-row justify-between items-center w-full mt-auto">
        <Link 
          href={contentUrl} 
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors truncate pr-2"
        >
          {comment.contentTitle}
        </Link>

        <div className="flex flex-row gap-0 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="pointer-events-none gap-1 text-muted-foreground"
          >
            <Icon icon="bxs:upvote" className="size-3" />
            {comment.voteScore}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UserCommentCard;