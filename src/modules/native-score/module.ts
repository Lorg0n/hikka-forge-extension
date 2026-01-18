import type { ForgeModuleDef } from '@/types/module';
import UserRatingComponent from './UserRatingComponent';

const nativeScoreModule: ForgeModuleDef = {
  id: 'native-score',
  name: 'Оцінка від Hikka', 
  description: 'Замість оцінки MAL відображаємо оцінку від hikka.io', 
  urlPatterns: ['https://hikka.io/anime/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: 'div.bg-secondary\\/20.flex.items-center.gap-1.rounded-md.border.px-2.backdrop-blur',
    position: 'replace',
  },
  component: UserRatingComponent,
};

export default nativeScoreModule;