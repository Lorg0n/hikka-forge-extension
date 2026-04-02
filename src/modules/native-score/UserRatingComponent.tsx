import React from 'react';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';

const UserRatingComponent: React.FC = () => {
    let slug = "";
    let content_type = "";

    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const match = path.match(/^\/(anime|manga|novel)\/(.+)/);
        if (match) {
            slug = match[2];
            content_type = match[1];
        }
    }

    let dataHook;
    if (content_type === "anime") dataHook = useForgeAnimeDetails({ slug });
    else return null;

    const { data, loading, error } = dataHook;

    if (loading) {
        return (
            <div className="flex items-center gap-1">
                <div className="w-12 h-5 rounded bg-secondary/20 animate-pulse backdrop-blur" />
            </div>
        );
    }

    if (error || !data?.weightedRating) {
        return null;
    }

    return (
        <div className="flex items-center gap-1">
            <p className="font-display font-bold">
                {data.weightedRating.toFixed(2)}
            </p>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                className="text-lg text-primary-foreground" 
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