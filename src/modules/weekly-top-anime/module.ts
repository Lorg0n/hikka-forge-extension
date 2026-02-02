import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimeComponent from './WeeklyTopAnimeComponent'

const weeklyTopAnimeModule: ForgeModuleDef = {
    id: 'weekly-top-anime',
    name: 'Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://hikka.io/'],
    enabledByDefault: true,
    elementSelector: {
        selector: 'div:has(> a[href="/anime?statuses=ongoing"] > h2.scroll-m-20)',
        position: 'append',
    },
    component: WeeklyTopAnimeComponent
};

export default weeklyTopAnimeModule;