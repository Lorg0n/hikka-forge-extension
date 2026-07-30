import type { ForgeModuleDef } from '@/types/module';
import ContentRelationsButton from './ContentRelationsButton';

const contentRelationsModule: ForgeModuleDef = {
    id: 'content-relations',
    name: "Зв'язки між тайтлами",
    description: 'Додає кнопку для відкриття сторінки пов\'язаного контенту (#related) поруч із блоком "Пов\'язане".',
    beta: true,
    urlPatterns: [
        'https://dev.hikka.io/anime/*',
        'https://dev.hikka.io/manga/*',
    ],
    enabledByDefault: true,
    category: 'content',
    elementSelector: {
        selector: '#content-franchise > div > div > div:first-child > div',
        position: 'append',
        hostWidth: 'auto',
    },
    component: ContentRelationsButton,
    icon: {
        name: 'lucide:workflow',
        color: '#a78bfa',
    },
};

export default contentRelationsModule;
