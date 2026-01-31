import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

interface PaginationProps extends React.ComponentProps<"nav"> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

const Pagination = ({
  className,
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  ...props
}: PaginationProps) => {
  // Helper to generate the page numbers array
  const generatePagination = () => {
    // If total pages is small, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "DOTS", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "DOTS", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "DOTS", ...middleRange, "DOTS", lastPageIndex];
    }
    
    return [];
  };

  const pages = generatePagination();

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center gap-1", className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:flex"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </Button>

      <div className="flex flex-row gap-1 items-center">
        {pages.map((page, i) => {
          if (page === "DOTS") {
            return (
              <div key={`dots-${i}`} className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "outline" : "ghost"}
              size="icon"
              className={cn(
                  currentPage === page && "pointer-events-none border-primary/50 bg-secondary/50",
                  "w-9 h-9"
              )}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:flex"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </Button>
    </nav>
  )
}

export { Pagination }