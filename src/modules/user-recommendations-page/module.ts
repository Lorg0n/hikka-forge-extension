import type { ForgeModuleDef } from '@/types/module';
import RecommendationsPageComponent from './RecommendationsPageComponent';

const recommendationsPageModule: ForgeModuleDef = {
    id: 'recommendations-page',
    name: 'Сторінка персональних рекомендацій',
    description: 'Повноцінна сторінка з персональними рекомендаціями на основі вашого списку.',
    urlPatterns: ['https://hikka.io/#recommendations'],
    enabledByDefault: true,
    hidden: true,
    authRequired: true,
    elementSelector: {
        selector: 'main',
        position: 'replace',
    },
    component: RecommendationsPageComponent,
};

export default recommendationsPageModule;