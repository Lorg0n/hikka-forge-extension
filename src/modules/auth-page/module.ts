import type { ForgeModuleDef } from '@/types/module';
import AuthPageComponent from './AuthPageComponent';

const authPageModule: ForgeModuleDef = {
  id: 'auth-page',
  name: 'Сторінка авторизації',
  description: 'Замінює основний вміст сайту на окрему сторінку авторизації.',
  urlPatterns: ['https://hikka.io/forge*'],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'div.flex.w-52.flex-col.gap-8',
    position: 'replace',
  },
  component: AuthPageComponent
};

export default authPageModule;