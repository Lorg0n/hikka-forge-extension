import type { ForgeModuleDef } from '@/types/module';
import SimilarPageComponent from './SimilarPageComponent';

const similarPageModule: ForgeModuleDef = {
  id: 'similar-page',
  name: 'Сторінка схожого контенту',
  description: 'Додає повноцінну адаптивну сторінку схожого аніме та манґи з навігацією',
  urlPatterns: [
    'https://hikka.io/anime/*#similar',
    'https://hikka.io/manga/*#similar',
    'https://dev.hikka.io/anime/*#similar',
    'https://dev.hikka.io/manga/*#similar',
  ],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'main',
    position: 'replace',
  },
  component: SimilarPageComponent,
};

export default similarPageModule;
