import type { ForgeModuleDef } from '@/types/module';
import UserCommentsPageComponent from './UserCommentsPageComponent';

const userCommentPageModule: ForgeModuleDef = {
  id: 'user-comments-page',
  name: 'Сторінка коментарів користувача',
  description: 'Додає окрему сторінку для перегляду всіх коментарів користувача з можливістю сортування.',
  urlPatterns: ['https://hikka.io/u/*#comments'],
  enabledByDefault: true,
  hidden: true,
  elementSelector: {
    selector: 'main',
    position: 'replace',
  },
  component: UserCommentsPageComponent,
};

export default userCommentPageModule;