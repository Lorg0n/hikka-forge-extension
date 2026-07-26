import type { ForgeModuleDef } from '@/types/module';
import SimilarMangaPageComponent from './SimilarMangaPageComponent';

const similarMangaPageModule: ForgeModuleDef = {
  id: 'similar-manga-page',
  name: 'Сторінка схожої манґи',
  description: 'Додає повноцінну сторінку схожої манґи з навігацією',
  urlPatterns: ['https://dev.hikka.io/manga/*#similar'],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'main',
    position: 'replace',
  },
  component: SimilarMangaPageComponent,
};

export default similarMangaPageModule;
