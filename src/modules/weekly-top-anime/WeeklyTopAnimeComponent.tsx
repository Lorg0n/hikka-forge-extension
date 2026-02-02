import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';

const WeeklyTopAnimeComponent: React.FC = () => {
    return (
        <div>
            <Button size={"icon-sm"} variant={"outline"}>
                <a href="#weekly-top-anime">
                    <Icon icon={"material-symbols:bar-chart-4-bars-rounded"} />
                </a>
            </Button>
        </div>
    );
};

export default WeeklyTopAnimeComponent;