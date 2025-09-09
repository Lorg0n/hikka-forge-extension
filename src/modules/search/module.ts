import type { ForgeModuleDef } from '@/types/module';
import { SearchTrigger } from './SearchTriggerComponent';
import { supportsWebAssembly } from '@/utils/webassembly-check';

const animeSearchModule: ForgeModuleDef = {
  id: 'search',
  name: 'Пошук',
  description: 'Пошук за описом природною мовою з використанням текстових ембедингів. Потребує підтримки WebAssembly.',
  urlPatterns: ['https://hikka.io/*'],
  enabledByDefault: supportsWebAssembly(),
  isBeta: true,
  elementSelector: {
    selector: 'nav[class="container relative mx-auto flex min-h-16 items-center gap-4 px-4 md:gap-8"] > div[class="flex gap-4"] > div[class="flex items-center gap-4"]',
    position: 'prepend',
  },
  component: SearchTrigger,
};

export default animeSearchModule;
