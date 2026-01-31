import React from 'react';
import { CommentItem } from '@/types';
import UserCommentCard from '@/components/ui/user/user-comment-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserCommentsPageListProps {
    items: CommentItem[];
    totalElements: number;
    sort: string;
    onSortChange: (value: string) => void;
}

const sortOptions = [
    { value: 'hikkaCreated,desc', label: 'Спочатку нові' },
    { value: 'hikkaCreated,asc', label: 'Спочатку старі' },
    { value: 'voteScore,desc', label: 'Найпопулярніші' },
    { value: 'totalReplies,desc', label: 'Найбільше обговорювані' },
];

export const UserCommentsPageList: React.FC<UserCommentsPageListProps> = ({ items, totalElements, sort, onSortChange }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-lg">Всі коментарі ({totalElements})</h3>
                <Select value={sort} onValueChange={onSortChange}>
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