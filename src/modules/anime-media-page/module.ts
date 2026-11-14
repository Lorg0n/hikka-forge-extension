import type { ForgeModuleDef } from '@/types/module';
import AnimeMediaPage from './AnimeMediaPage';

export default {
    id: 'anime-media-page', name: '[Anime] Media page', description: 'Shows fan media as a standalone page.',
    dependsOn: 'media-plus', hidden: true,
    urlPatterns: ['https://hikka.io/anime/*#fan', 'https://dev.hikka.io/anime/*#fan'],
    elementSelector: { selector: 'main', position: 'replace' }, component: AnimeMediaPage,
} satisfies ForgeModuleDef;
