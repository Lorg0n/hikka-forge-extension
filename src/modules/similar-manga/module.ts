import type { ForgeModuleDef } from '@/types/module';
import SimilarMangaComponent from './SimilarMangaComponent';

const mangaSimilarModule: ForgeModuleDef = {
  id: 'similar-manga',
  name: 'Схожа манґа',
  description: 'Додає модуль схожої манґи, яка визначається за допомогою спеціальної моделі.',
  urlPatterns: ['https://dev.hikka.io/manga/*'],
  enabledByDefault: true,
  category: 'recommendations',
  elementSelector: {
    selector: '#content-center > div.order-last',
    position: 'before',
    index: 0
  },
  component: SimilarMangaComponent,
  icon: {
    name: 'lucide:book-open',
    color: '#4a4cde',
  },
};

export default mangaSimilarModule;
