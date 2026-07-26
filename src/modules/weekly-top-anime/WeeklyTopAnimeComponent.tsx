import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';
import { ModuleTransition } from '@/components/ui/module-transition';

const WeeklyTopAnimeComponent: React.FC = () => {
    return (
        <ModuleTransition stateKey="content">
            <Button size="icon-sm" variant="outline" className="text-muted-foreground" asChild>
                <a href="#weekly-top-anime" aria-label="Топ аніме тижня">
                    <Icon icon="material-symbols:bar-chart-4-bars-rounded" />
                </a>
            </Button>
        </ModuleTransition>
    );
};

export default WeeklyTopAnimeComponent;
