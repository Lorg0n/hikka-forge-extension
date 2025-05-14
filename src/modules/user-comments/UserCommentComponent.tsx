import React from 'react';
import { useUserComments } from '@/hooks/useUserComments';
import { Card } from '@/components/ui/card';
import MDViewer from '@/components/ui/markdown/MD-viewer';
import Link from '@/components/typography/link';

interface UserCommentComponentProps {
  username: string;
  commentsPerPage?: number;
}

const getTypeOfUrl = (url: string): string => {
  const urlParts = url.split("/");
  const typeOfAnime = urlParts[3];
  return typeOfAnime.slice(0, 1).toUpperCase() + typeOfAnime.slice(1).toLowerCase();
};

const UserCommentComponent: React.FC<UserCommentComponentProps> = () => {
  const username = window.location.pathname.split('/u/')[1];
  const { data, loading, error, refresh, } = useUserComments({ username: username });
  const croppedComments = data?.comments.slice(0, 3) || [];

  if (error) { return null; }

  if (loading) {
    return (<>
      <div className="flex flex-row w-full gap-4">
        {Array.from({ length: 3 }).map((_) => (
          <Card className="flex flex-col w-1/3 bg-secondary/20 p-4 isolate gap-6 overflow-hidden rounded-none md:rounded-lg">
            <div className="flex flex-col gap-2 w-full">
              <div className="w-64 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              <div className="w-64 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              <div className="w-64 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
            </div>
            <div className="w-24 h-2 animate-pulse bg-secondary/20 rounded-lg"></div>
          </Card>
        ))}
      </div>
    </>)
  }

  return (
    <>
      <div className="flex flex-row w-full gap-4">
        {croppedComments.map((comment) => (
          <Card className="flex flex-col w-1/3 bg-secondary/20 p-4 isolate rounded-none md:rounded-lg justify-between">
            <MDViewer className="text-[0.9375rem] line-clamp-4">
                {comment.text}
              </MDViewer>
            <Link href={comment.source} className="text-xs leading-normal line-clamp-1 mt-2">
              {getTypeOfUrl(comment.source)}
            </Link>
          </Card>
        ))}
      </div>
    </>
  )
};

export default UserCommentComponent;