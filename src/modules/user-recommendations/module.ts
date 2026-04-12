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
        selector: '#feed-left', 
        position: 'append', 
    },
    component: UserRecommendationsComponent,
    icon: {
		name: 'si:ai-fill',
		color: '#2bb0c7'
	},
};

export default userRecommendationsModule;