import type { ForgeModuleDef } from '@/types/module';
import MangaMediaPlusComponent from './MangaMediaPlusComponent';

const mangaMediaPlusModule: ForgeModuleDef = {
    id: 'manga-media-plus',
    name: '[Manga] Медіа+',
    description: 'Показує фанатські медіа на сторінках манґи, де штатного блоку медіа немає.',
    dependsOn: 'media-plus',
    hidden: true,
    urlPatterns: [
        'https://hikka.io/manga/*=',
        'https://dev.hikka.io/manga/*=',
    ],
    elementSelector: {
        selector: '#content-center > div.order-last',
        position: 'before',
        index: 0,
    },
    component: MangaMediaPlusComponent,
};

export default mangaMediaPlusModule;
