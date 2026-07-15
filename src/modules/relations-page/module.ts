import type { ForgeModuleDef } from '@/types/module';
import RelationsPageComponent from './RelationsPageComponent';

const relationsPageModule: ForgeModuleDef = {
    id: 'relations-page',
    name: '[Page] Пов\'язане',
    description: 'Відображає повну сторінку пов\'язаного контенту за хешем #related.',
    urlPatterns: [
        'https://hikka.io/anime/*#related',
        'https://hikka.io/manga/*#related',
    ],
    enabledByDefault: true,
    hidden: true,
    elementSelector: {
        selector: 'main',
        position: 'replace',
    },
    component: RelationsPageComponent,
};

export default relationsPageModule;
