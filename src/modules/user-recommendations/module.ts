import type { ForgeModuleDef } from '@/types/module';
import UserRecommendationsComponent from './UserRecommendationsComponent';

const userRecommendationsModule: ForgeModuleDef = {
    id: 'user-recommendations',
    name: 'Персональні рекомендації',
    description: 'Відображає блок з рекомендаціями на основі вашого списку переглянутого.',
    urlPatterns: ['https://hikka.io/*', 'https://hikka.io', 'https://dev.hikka.io/*', 'https://dev.hikka.io'],
    enabledByDefault: false,
    authRequired: true,
    category: 'recommendations',
    elementSelector: {
        selector: '#feed-left', 
        position: 'append', 
    },
    component: UserRecommendationsComponent,
    icon: {
		name: 'lucide:sparkles',
		color: '#22d3ee'
	},
};

export default userRecommendationsModule;
