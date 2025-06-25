import type { ForgeModuleDef } from '@/types/module';
import SimilarAnimeComponent  from './SimilarAnimeComponent';

const userCommentModule: ForgeModuleDef = {
  id: 'similar-anime',
  name: 'Схожі аніме',
  description: 'Додає модуль схожих аніме, які визначаються за допомогою спеціальної моделі.',
  urlPatterns: ['https://hikka.io/anime/*'],
  elementSelector: {
    selector: 'div.order-2.flex.flex-col.gap-12',
    position: 'append',
  },
  component: SimilarAnimeComponent,
};

export default userCommentModule;