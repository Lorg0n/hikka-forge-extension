import React from 'react';
import { useUserComments } from '@/hooks/useUserComments';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link';
import { CONTENT_TYPE, CONTENT_TYPE_URL, HIKKA_BASE } from '@/constants';
import { Badge } from '@/components/ui/badge';
import NotFound from '@/components/ui/not-found';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';


interface UserCommentComponentProps {
  username: string;
  commentsPerPage?: number;
}

const getSourceURL = (sourceType: string, sourceSlug: string): string => {
  return `${HIKKA_BASE}/comments/${CONTENT_TYPE_URL[sourceType as keyof typeof CONTENT_TYPE_URL]}/${sourceSlug}`;
};

const getSourceName = (sourceType: string): string => {
  return `${CONTENT_TYPE[sourceType as keyof typeof CONTENT_TYPE]}`;
};

const UserCommentComponent: React.FC<UserCommentComponentProps> = () => {
  const username = window.location.pathname.split('/u/')[1];
  const { data, loading, error, } = useUserComments({ username: username });
  const croppedComments = data?.comments.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <h3 className="font-display text-xl font-bold">Коментарі</h3>
        <div className="flex flex-row w-full gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="flex flex-col w-1/3 bg-secondary/20 p-4 isolate gap-6 overflow-hidden rounded-none md:rounded-lg">
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              </div>
              <div className="w-20 h-3 animate-pulse bg-secondary/20 rounded-lg mt-4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (croppedComments.length === 0 || error) {
    return (
      <div className="flex flex-col gap-8">
        <h3 className="font-display text-xl font-bold">Коментарі</h3>
        <NotFound
          title="Коментарів поки немає"
          description="Можливо, вони ще не оновилися або їх ще ніхто не залишив"
        />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-xl font-bold">Коментарі</h3>
      <div className="flex flex-col md:flex-row w-full gap-4">
        {croppedComments.map((comment, index) => (
          <Card key={index} className="flex flex-col md:w-1/3 bg-secondary/20 p-4 isolate rounded-none rounded-lg justify-between">
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
                <Button
                    variant="ghost"
                    size="sm"
                    className="pointer-events-none gap-1 text-muted-foreground"
                  >
                    <Icon icon="tabler:message-filled" className="size-3" />
                    {comment.total_replies}
                  </Button>
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
        ))}
      </div>
    </div>
  );
};

export default UserCommentComponent;