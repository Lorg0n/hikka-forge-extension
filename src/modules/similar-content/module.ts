import type { ForgeModuleDef } from '@/types/module';
import SimilarContentComponent from './SimilarContentComponent';

const similarContentModule: ForgeModuleDef = {
    id: 'similar-content',
    name: 'Схожий контент',
    description: 'Додає модуль схожого аніме та манґи, які визначаються за допомогою спеціальної моделі.',
    urlPatterns: [
        'https://dev.hikka.io/anime/*',
        'https://dev.hikka.io/manga/*',
    ],
    enabledByDefault: true,
    category: 'recommendations',
    elementSelector: {
        selector: '#content-center > div.order-last',
        position: 'before',
        index: 0,
    },
    component: SimilarContentComponent,
    icon: {
        name: 'lucide:sparkles',
        color: '#4a4cde',
    },
};

export default similarContentModule;
