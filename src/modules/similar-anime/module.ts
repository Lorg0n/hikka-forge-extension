import type { ForgeModuleDef } from '@/types/module';
import SimilarAnimeComponent  from './SimilarAnimeComponent';

const animeSimilarModule: ForgeModuleDef = {
  id: 'similar-anime',
  name: 'Схожі аніме',
  description: 'Додає модуль схожих аніме, які визначаються за допомогою спеціальної моделі.',
  urlPatterns: ['https://hikka.io/anime/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: 'div[class="flex flex-col gap-12 lg:col-span-2"]',
    position: 'append',
  },
  component: SimilarAnimeComponent,
};

export default animeSimilarModule;