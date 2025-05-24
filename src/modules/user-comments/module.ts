import type { ForgeModuleDef } from '@/types/module';
import UserCommentComponent from './UserCommentComponent';

const userCommentModule: ForgeModuleDef = {
  id: 'user-comments',
  name: 'Модуль коментарів користувача',
  description: 'Додає коментарі користувача до профілю користувача.',
  urlPatterns: ['https://hikka.io/u/*'],
  elementSelector: {
    selector: 'div.order-2.flex.flex-col.gap-12',
    position: 'append',
  },
  component: UserCommentComponent,
};

export default userCommentModule;