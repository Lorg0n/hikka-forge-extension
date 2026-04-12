import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimeComponent from './WeeklyTopAnimeComponent'

const weeklyTopAnimeModule: ForgeModuleDef = {
    id: 'weekly-top-anime',
    name: 'Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://hikka.io/', 'https://hikka.io/*'],
    enabledByDefault: true,
    elementSelector: {
        selector: '#ongoings div.flex.items-center.gap-4:has(> a > h4)',
        position: 'append',
        visibleOnly: true,
    },
    component: WeeklyTopAnimeComponent,
    icon: {
		name: 'material-symbols:bar-chart-4-bars-rounded',
		color: '#2bc78b'
	},
};

export default weeklyTopAnimeModule;