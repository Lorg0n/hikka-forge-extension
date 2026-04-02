import type { ForgeModuleDef } from '@/types/module';
import UserRatingComponent from './UserRatingComponent';

const nativeScoreModule: ForgeModuleDef = {
  id: 'native-score',
  name: 'Зважена оцінка Hikka',
  description: 'Замінює стандартну (сиру) оцінку Hikka на зважену',
  urlPatterns: ['https://hikka.io/anime/*'],
  enabledByDefault: false,
  elementSelector: {
    selector: 'div.bg-secondary\\/20 > div.flex.gap-2.items-center:last-of-type > div > div',
    position: 'replace',
  },
  component: UserRatingComponent,
};

export default nativeScoreModule;