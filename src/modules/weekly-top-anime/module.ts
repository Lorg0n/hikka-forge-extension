import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimeComponent from './WeeklyTopAnimeComponent'

const weeklyTopAnimeModule: ForgeModuleDef = {
    id: 'weekly-top-anime',
    name: 'Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://hikka.io/'],
    enabledByDefault: true,
    elementSelector: {
        selector: 'div:has(> a[href="/anime?statuses=%5B%22ongoing%22%5D&types=%5B%22tv%22%5D&seasons=%5B%22winter%22%5D&years=%5B2026%2C2026%5D&sort=%5B%22scored_by%22%2C%22score%22%2C%22native_scored_by%22%2C%22native_score%22%5D&order=desc"] > h4)',
        position: 'append',
    },
    component: WeeklyTopAnimeComponent
};

export default weeklyTopAnimeModule;