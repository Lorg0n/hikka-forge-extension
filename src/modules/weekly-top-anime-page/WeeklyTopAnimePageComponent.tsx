import React from 'react';
import { WeeklyTopPageHeader } from './WeeklyTopPageHeader';

const WeeklyTopAnimePageComponent: React.FC = () => {
    return (<main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
        <div className="flex flex-col gap-12">
            <div id="comments-header">
                <WeeklyTopPageHeader />
            </div>
        </div>
    </main>);
};

export default WeeklyTopAnimePageComponent;