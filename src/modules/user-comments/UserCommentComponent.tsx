import React from 'react';
import { useUserComments } from '@/hooks/useUserComments';
import { Card } from '@/components/ui/card';
import NotFound from '@/components/ui/not-found';
import UserCommentCard from '@/components/ui/user/user-comment-card';

const UserCommentComponent: React.FC = () => {
  const username = typeof window !== 'undefined' ? window.location.pathname.split('/u/')[1] : '';

  const { data, loading, error } = useUserComments({
    username: username,
    initialSize: 3,                
    initialSort: 'hikkaCreated,desc', 
  });

  const comments = data?.content || [];

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <h3 className="font-display text-lg font-bold">Коментарі</h3>
        <div className="flex flex-col md:flex-row w-full gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="flex flex-col w-full md:w-1/3 bg-background-secondary p-4 isolate gap-6 overflow-hidden rounded-lg">
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
              </div>
              <div className="w-20 h-3 animate-pulse bg-secondary/20 rounded-lg mt-auto"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || comments.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <h3 className="font-display text-lg font-bold">Коментарі</h3>
        <NotFound
          title="Коментарів поки немає"
          description={error ? 'Не вдалося завантажити коментарі' : 'Можливо, вони ще не оновилися або їх ще ніхто не залишив'}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-lg font-bold">Коментарі</h3>
      <div className="flex flex-col md:flex-row w-full gap-4">
        {comments.map((comment) => (
          <UserCommentCard
            key={`${comment.contentSlug}-${comment.createdAt}`}
            comment={comment}
          />
        ))}
      </div>
    </div>
  );
};

export default UserCommentComponent;