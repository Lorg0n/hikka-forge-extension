import type { ForgeModuleDef } from '@/types/module';
import MediaPlusComponent from './MediaPlusComponent';

const mediaPlusModule: ForgeModuleDef = {
    id: 'media-plus',
    name: 'Медіа+',
    description: 'Доповнює вкладку медіа добіркою нових матеріалів',
    urlPatterns: [
        'https://hikka.io/anime/*=',
        'https://hikka.io/manga/*=',
        'https://dev.hikka.io/anime/*=',
        'https://dev.hikka.io/manga/*=',
    ],
    enabledByDefault: true,
    persistent: true,
    category: 'content',
    elementSelector: {
        selector: '#content-media',
        position: 'append',
        initiallyHidden: true,
    },
    component: MediaPlusComponent,
    icon: {
        name: 'lucide:panels-top-left',
        color: '#f59e0b',
    },
};

export default mediaPlusModule;
