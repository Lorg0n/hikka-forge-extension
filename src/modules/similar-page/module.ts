import type { ForgeModuleDef } from '@/types/module';
import SimilarPageComponent from './SimilarPageComponent';

const similarPageModule: ForgeModuleDef = {
  id: 'similar-page',
  name: 'Сторінка схожих аніме',
  description: 'Додає повноцінну сторінку схожих аніме з навігацією',
  urlPatterns: ['https://hikka.io/anime/*#similar'],
  enabledByDefault: true,
  elementSelector: {
    selector: 'main',
    position: 'replace',
  },
  component: SimilarPageComponent,
};

export default similarPageModule;