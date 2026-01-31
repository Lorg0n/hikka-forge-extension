import React from 'react';
import { CommentItem } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import UserCommentCardDetailed from '@/components/ui/user/user-comment-card-detailed';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface UserCommentsPageListProps {
    items: CommentItem[];
    totalElements: number;
    sort: string;
    onSortChange: (value: string) => void;
    isLoading?: boolean;
}

const sortOptions = [
    { value: 'hikkaCreated,desc', label: 'Спочатку нові' },
    { value: 'hikkaCreated,asc', label: 'Спочатку старі' },
    { value: 'voteScore,desc', label: 'Найпопулярніші' },
    { value: 'totalReplies,desc', label: 'Найбільше обговорювані' },
];

export const UserCommentsPageList: React.FC<UserCommentsPageListProps> = ({ 
    items, 
    totalElements, 
    sort, 
    onSortChange,
    isLoading = false 
}) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-lg">Всі коментарі ({totalElements})</h3>
                
                <Select value={sort} onValueChange={onSortChange} disabled={isLoading}>
                    <SelectTrigger className="w-fit min-w-[200px]">
                        <SelectValue placeholder="Сортувати за..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="flex flex-col w-full bg-background-secondary p-4 gap-6 rounded-lg">
                            <div className="flex flex-col gap-2 w-full">
                                <Skeleton className="w-full h-3 rounded-lg animate-pulse bg-secondary/20" />
                                <Skeleton className="w-5/6 h-3 rounded-lg animate-pulse bg-secondary/20" />
                                <Skeleton className="w-4/6 h-3 rounded-lg animate-pulse bg-secondary/20" />
                            </div>
                            <Skeleton className="w-20 h-3 rounded-lg mt-auto animate-pulse bg-secondary/20" />
                        </Card>
                    ))
                ) : (
                    items.map((comment) => (
                        <UserCommentCardDetailed 
                            key={`${comment.contentSlug}-${comment.createdAt}`} 
                            comment={comment}
                        />
                    ))
                )}
            </div>
        </section>
    );
};