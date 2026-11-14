import type { ForgeModuleDef } from '@/types/module';
import MangaMediaPage from './MangaMediaPage';

export default {
    id: 'manga-media-page',
    name: '[Manga] Media page',
    description: 'Shows the fan media page for manga.',
    dependsOn: 'media-plus',
    hidden: true,
    urlPatterns: ['https://hikka.io/manga/*#fan-media', 'https://dev.hikka.io/manga/*#fan-media'],
    elementSelector: {
        selector: 'main',
        position: 'replace',
    },
    component: MangaMediaPage,
} satisfies ForgeModuleDef;
