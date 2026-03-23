import type { ForgeModuleDef } from '@/types/module';
import SimilarAnimeComponent  from './SimilarAnimeComponent';

const animeSimilarModule: ForgeModuleDef = {
  id: 'similar-anime',
  name: 'Схожі аніме',
  description: 'Додає модуль схожих аніме, які визначаються за допомогою спеціальної моделі.',
  urlPatterns: ['https://hikka.io/anime/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: 'div.contents.lg\\:flex.lg\\:flex-col.lg\\:gap-8 > div.order-last',
    position: 'prepend',
    index: 0
  },
  component: SimilarAnimeComponent,
};

export default animeSimilarModule;