import type { ForgeModuleDef } from '@/types/module';
import UserRecommendationsComponent from './UserRecommendationsComponent';

const userRecommendationsModule: ForgeModuleDef = {
    id: 'user-recommendations',
    name: 'Персональні рекомендації',
    description: 'Відображає блок з рекомендаціями на основі вашого списку переглянутого.',
    urlPatterns: ['https://hikka.io/', 'https://hikka.io'], 
    enabledByDefault: false,
    authRequired: true, 
    elementSelector: {
        selector: '.flex.flex-col.gap-16 > div.flex.flex-col.gap-8', 
        position: 'before', 
    },
    
    component: UserRecommendationsComponent,
};

export default userRecommendationsModule;