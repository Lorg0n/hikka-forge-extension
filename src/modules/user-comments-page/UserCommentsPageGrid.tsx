import React from 'react';
import { CommentItem } from '@/types';

interface UserCommentsPageGridProps {
    items: CommentItem[];
    totalElements: number;
}

export const UserCommentsPageGrid: React.FC<UserCommentsPageGridProps> = ({ items, totalElements }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Всі коментарі ({totalElements})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((comment, index) => (
                    // Placeholder card as requested
                    <div 
                        key={`${comment.contentSlug}-${index}`} 
                        className="flex flex-col min-h-[150px] p-6 rounded-lg border border-dashed border-border bg-secondary/10 items-center justify-center text-muted-foreground"
                    >
                        <span className="text-sm font-medium">Comment Placeholder</span>
                        <span className="text-xs opacity-70 mt-1">{comment.contentTitle}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};