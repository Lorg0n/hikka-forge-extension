import { Pagination } from './pagination';

interface ModulePaginationProps {
    /** Zero-based page index used by module data hooks. */
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

/**
 * Pagination adapter for module hooks. The visual control is one-based while
 * every paginated Forge hook exposes a zero-based page index.
 */
export function ModulePagination({ page, totalPages, onPageChange }: ModulePaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-4">
            <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(nextPage) => onPageChange(nextPage - 1)}
            />
        </div>
    );
}
