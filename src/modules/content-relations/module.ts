import type { ForgeModuleDef } from '@/types/module';
import ContentRelationsButton from './ContentRelationsButton';

const contentRelationsModule: ForgeModuleDef = {
    id: 'content-relations',
    name: "Зв'язки між тайтлами",
    description: 'Додає кнопку для відкриття сторінки пов\'язаного контенту (#related) поруч із блоком "Пов\'язане".',
    urlPatterns: [
        'https://hikka.io/anime/*',
        'https://hikka.io/manga/*',
    ],
    enabledByDefault: true,
    elementSelector: {
        selector: '#content-franchise > div > div > div:first-child > div',
        position: 'append',
    },
    component: ContentRelationsButton,
    icon: {
        name: 'material-symbols:account-tree-outline',
        color: '#8b5cf6',
    },
};

export default contentRelationsModule;
