import type { ForgeModuleDef } from '@/types/module';
import MangaReaderComponent from './MangaReaderComponent';

const mangaReaderModule: ForgeModuleDef = {
  id: 'manga-reader',
  name: 'Manga Reader',
  description: 'Adds a manga reader to the manga page.',
  urlPatterns: ['https://hikka.io/manga/*'],
  elementSelector: {
    selector: '.grid.grid-cols-1.gap-12.lg\\:grid-cols-\\[20\\%_1fr\\].lg\\:gap-16 > div.flex.flex-col.gap-12 > div.grid.grid-cols-1.gap-12.lg\\:grid-cols-\\[1fr_33\\%\\].lg\\:gap-16.xl\\:grid-cols-\\[1fr_30\\%\\] > div.relative.order-2.flex.flex-col.gap-12.lg\\:order-1',
    position: 'prepend',
  },
  component: MangaReaderComponent,
};

export default mangaReaderModule;