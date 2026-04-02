import type { ForgeModuleDef } from '@/types/module';
import UserRecommendationsComponent from './UserRecommendationsComponent';

const userRecommendationsModule: ForgeModuleDef = {
    id: 'user-recommendations',
    name: 'Персональні рекомендації',
    description: 'Відображає блок з рекомендаціями на основі вашого списку переглянутого.',
    urlPatterns: ['https://hikka.io/*', 'https://hikka.io'], 
    enabledByDefault: false,
    authRequired: true, 
    elementSelector: {
        selector: 'aside.sticky.top-20.hidden.xl\\:block > div', 
        position: 'append', 
    },
    
    component: UserRecommendationsComponent,
};

export default userRecommendationsModule;