import type { ForgeModuleDef } from '@/types/module';
import WeeklyTopAnimeComponent from './WeeklyTopAnimeComponent'

const weeklyTopAnimeModule: ForgeModuleDef = {
    id: 'weekly-top-anime',
    name: 'Топ аніме тижня',
    description: 'Додає блок із посиланням на список найпопулярніших онґоінґів',
    urlPatterns: ['https://hikka.io/', 'https://hikka.io/*', 'https://dev.hikka.io/', 'https://dev.hikka.io/*'],
    enabledByDefault: true,
    category: 'content',
    elementSelector: {
        selector: '#ongoings .flex.min-h-8.items-center.gap-3',
        position: 'append',
        visibleOnly: true,
        hostWidth: 'auto',
    },
    component: WeeklyTopAnimeComponent,
    icon: {
		name: 'lucide:trending-up',
		color: '#34d399'
	},
};

export default weeklyTopAnimeModule;
