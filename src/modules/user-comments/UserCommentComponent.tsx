import React from 'react';
import { useUserComments } from '@/hooks/useUserComments';
import { Card } from '@/components/ui/card';
import NotFound from '@/components/ui/not-found';
import UserCommentCard from '@/components/ui/user/user-comment-card';

interface UserCommentComponentProps {
  username: string;
  commentsPerPage?: number;
}

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
          <UserCommentCard key={index} comment={comment} />
        ))}
      </div>
    </div>
  );
};

export default UserCommentComponent;