import type { ForgeModuleDef } from '@/types/module';
import RelationsPageComponent from './RelationsPageComponent';

const relationsPageModule: ForgeModuleDef = {
    id: 'relations-page',
    name: '[Page] Пов\'язане',
    description: 'Відображає повну сторінку пов\'язаного контенту за хешем #related.',
    urlPatterns: [
        'https://dev.hikka.io/anime/*#related',
        'https://dev.hikka.io/manga/*#related',
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
