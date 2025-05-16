import React from 'react';
import { useUserComments } from '@/hooks/useUserComments';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link';
import { CONTENT_TYPE, CONTENT_TYPE_URL, HIKKA_BASE } from '@/constants';
import { Badge } from '@/components/ui/badge';

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
  const { data, loading, error, refresh, } = useUserComments({ username: username });
  const croppedComments = data?.comments.slice(0, 3) || [];

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-row w-full gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="flex flex-col w-1/3 bg-secondary/20 p-4 isolate gap-6 overflow-hidden rounded-none md:rounded-lg">
            <div className="flex flex-col gap-2 w-full">
              <div className="w-full h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
            </div>
            <div className="w-24 h-2 animate-pulse bg-secondary/20 rounded-lg mt-4"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full gap-4">
      {croppedComments.map((comment, index) => (
        <Card key={index} className="flex flex-col w-1/3 bg-secondary/20 p-4 isolate rounded-none rounded-lg justify-between">
          <MDViewer className="text-[0.9375rem] line-clamp-4">
            {comment.text}
          </MDViewer>
          <Link href={getSourceURL(comment.source_type, comment.source_slug)}>
            <Badge variant="secondary" className="rounded-lg cursor-pointer">
              {getSourceName(comment.source_type)}
            </Badge>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default UserCommentComponent;