import React from 'react';
import { useAnimeDetails } from '@/hooks/useAnimeDetails';
import { useMangaDetails } from '@/hooks/useMangaDetails';
import { useNovelDetails } from '@/hooks/useNovelDetail';

const UserRatingComponent: React.FC = () => {
    let slug = "";
    let content_type = "";
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const match = path.match(/^\/(anime|manga|novel)\/(.+)/);
        if (match) {
        slug = match[2]; // the slug part
        content_type = match[1];
        }
    }

    let dataHook;
    if (content_type === "anime") dataHook = useAnimeDetails({ slug });
    else if (content_type === "manga") dataHook = useMangaDetails({ slug });
    else if (content_type === "novel") dataHook = useNovelDetails({ slug });
    else return null; 

    const { data, loading, error } = dataHook;

    if (loading || !data?.native_score || !data?.native_scored_by) {
        return null;
    }

    // 7.51983 avg for native score
    const rating = ((data?.native_scored_by * data?.native_score) + (25 * 7.51983)) / (data?.native_scored_by + 25)

    if (error || rating == null) {
        return null;
    }

    return (
        <div className="bg-secondary/20 flex items-center gap-1 rounded-md border px-2 backdrop-blur">
            <div className="font-display text-xl font-bold">
                {rating.toFixed(1)}
            </div>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="text-xl text-primary-foreground"
            >
                <path
                fill="currentColor"
                d="m12 17.275l-4.15 2.5q-.275.175-.575.15t-.525-.2t-.35-.437t-.05-.588l1.1-4.725L3.775 10.8q-.25-.225-.312-.513t.037-.562t.3-.45t.55-.225l4.85-.425l1.875-4.45q.125-.3.388-.45t.537-.15t.537.15t.388.45l1.875 4.45l4.85.425q.35.05.55.225t.3.45t.038.563t-.313.512l-3.675 3.175l1.1 4.725q.075.325-.05.588t-.35.437t-.525.2t-.575-.15z"
                />
            </svg>
        </div>
    );
};

export default UserRatingComponent;
