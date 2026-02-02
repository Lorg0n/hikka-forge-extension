import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimePageComponent from './WeeklyTopAnimePageComponent';

const weeklyTopAnimePageModule: ForgeModuleDef = {
    id: 'weekly-top-anime-page',
    name: '[Page] Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://hikka.io/#weekly-top-anime'],
    enabledByDefault: true,
    hidden: true,
    elementSelector: {
        selector: 'main',
        position: 'replace',
    },
    component: WeeklyTopAnimePageComponent
};

export default weeklyTopAnimePageModule;