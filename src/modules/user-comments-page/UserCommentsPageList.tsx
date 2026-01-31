import React from 'react';
import { CommentItem } from '@/types';
import UserCommentCard from '@/components/ui/user/user-comment-card';

interface UserCommentsPageListProps {
    items: CommentItem[];
    totalElements: number;
}

export const UserCommentsPageList: React.FC<UserCommentsPageListProps> = ({ items, totalElements }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Всі коментарі ({totalElements})</h3>
            </div>

            <div className="flex flex-col gap-4">
                {items.map((comment) => (
                    <UserCommentCard 
                        key={`${comment.contentSlug}-${comment.createdAt}`} 
                        comment={comment}
                    />
                ))}
            </div>
        </section>
    );
};