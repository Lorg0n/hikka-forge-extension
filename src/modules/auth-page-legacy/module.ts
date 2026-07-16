import type { ForgeModuleDef } from '@/types/module';
import AuthPageLegacyComponent from './AuthPageLegacyComponent';

const authPageLegacyModule: ForgeModuleDef = {
  id: 'auth-page-legacy',
  name: 'Сторінка авторизації (спадщина)',
  description: 'Зворотно-сумісна сторінка авторизації на hikka.io/forge для старих версій OAuth-редиректу.',
  urlPatterns: ['https://hikka.io/forge*'],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'div.flex.w-full.max-w-md.flex-col.text-center',
    position: 'replace',
  },
  component: AuthPageLegacyComponent
};

export default authPageLegacyModule;