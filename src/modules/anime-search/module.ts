import type { ForgeModuleDef } from '@/types/module';
import AnimeSearchComponent from './AnimeSearchComponent';

const animeSearchModule: ForgeModuleDef = {
  id: 'anime-search',
  name: 'Anime Search',
  description: 'Search anime by natural language descriptions using text embeddings',
  urlPatterns: ['https://hikka.io/*'],
  enabledByDefault: false,
  elementSelector: {
    selector: 'nav[class="container relative mx-auto flex min-h-16 items-center gap-4 px-4 md:gap-8"] > div[class="flex gap-4"] > div[class="flex items-center gap-4"]',
    position: 'prepend',
  },
  component: AnimeSearchComponent,
};

export default animeSearchModule;
