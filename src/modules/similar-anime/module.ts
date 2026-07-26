import type { ForgeModuleDef } from '@/types/module';
import SimilarAnimeComponent from './SimilarAnimeComponent';

const animeSimilarModule: ForgeModuleDef = {
  id: 'similar-anime',
  name: 'Схожі аніме',
  description: 'Додає модуль схожих аніме, які визначаються за допомогою спеціальної моделі.',
  urlPatterns: ['https://dev.hikka.io/anime/*'],
  enabledByDefault: true,
  category: 'recommendations',
  elementSelector: {
    selector: '#content-center > div.order-last',
    position: 'prepend',
    index: 0
  },
  component: SimilarAnimeComponent,
  icon: {
    name: 'lucide:tv-minimal-play',
    color: '#4ade80',
  },
};

export default animeSimilarModule;
