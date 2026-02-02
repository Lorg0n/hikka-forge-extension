import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';

const WeeklyTopAnimeComponent: React.FC = () => {
    return (
        <div>
            <a href="#weekly-top-anime">
                <Button size={"icon-sm"} variant={"outline"}>
                    <Icon icon={"material-symbols:bar-chart-4-bars-rounded"} />
                </Button>
            </a>
        </div>
    );
};

export default WeeklyTopAnimeComponent;