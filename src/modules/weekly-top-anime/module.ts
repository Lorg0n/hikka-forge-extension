import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimeComponent from './WeeklyTopAnimeComponent'

const weeklyTopAnimeModule: ForgeModuleDef = {
    id: 'weekly-top-anime',
    name: 'Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://dev.hikka.io/', 'https://dev.hikka.io/*'],
    enabledByDefault: true,
    category: 'recommendations',
    elementSelector: {
        selector: '#ongoings div.flex.items-center.gap-4:has(> a > h4)',
        position: 'append',
        visibleOnly: true,
    },
    component: WeeklyTopAnimeComponent,
    icon: {
		name: 'lucide:trending-up',
		color: '#34d399'
	},
};

export default weeklyTopAnimeModule;
