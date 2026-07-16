import type { ForgeModuleDef } from '@/types/module';
import AuthPageComponent from './AuthPageComponent';

const authPageModule: ForgeModuleDef = {
  id: 'auth-page',
  name: 'Сторінка авторизації',
  description: 'Керує сторінкою авторизації на бекенді через HikkaForgeAuth API.',
  urlPatterns: ['https://hikka-forge.lorgon.dev/login*'],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'body',
    position: 'append',
    visibleOnly: false,
  },
  component: AuthPageComponent
};

export default authPageModule;