import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';
import { ModuleTransition } from '@/components/ui/module-transition';

const WeeklyTopAnimeComponent: React.FC = () => {
    return (
        <ModuleTransition stateKey="content">
        <div>
            <a href="#weekly-top-anime">
                <Button size={"icon-sm"} variant={"outline"}>
                    <Icon icon={"material-symbols:bar-chart-4-bars-rounded"} />
                </Button>
            </a>
        </div>
        </ModuleTransition>
    );
};

export default WeeklyTopAnimeComponent;
