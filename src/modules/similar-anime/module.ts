import type { ForgeModuleDef } from '@/types/module';
import SimilarAnimeComponent from './SimilarAnimeComponent';

const animeSimilarModule: ForgeModuleDef = {
  id: 'similar-anime',
  name: 'Схожі аніме',
  description: 'Додає модуль схожих аніме, які визначаються за допомогою спеціальної моделі.',
  urlPatterns: ['https://hikka.io/anime/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: '#content-center > div.order-last',
    position: 'prepend',
    index: 0
  },
  component: SimilarAnimeComponent,
  icon: {
    name: 'lucide:tv-minimal-play',
    color: '#47ff56',
  },
};

export default animeSimilarModule;