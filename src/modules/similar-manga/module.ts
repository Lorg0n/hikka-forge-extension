import type { ForgeModuleDef } from '@/types/module';
import SimilarMangaComponent from './SimilarMangaComponent';

const mangaSimilarModule: ForgeModuleDef = {
  id: 'similar-manga',
  name: 'Схожа манґа',
  description: 'Додає модуль схожої манґи, яка визначається за допомогою спеціальної моделі.',
  urlPatterns: ['https://hikka.io/manga/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: '#content-center > div.order-last',
    position: 'prepend',
    index: 0
  },
  component: SimilarMangaComponent,
  icon: {
    name: 'lucide:book-open',
    color: '#47ff56',
  },
};

export default mangaSimilarModule;
