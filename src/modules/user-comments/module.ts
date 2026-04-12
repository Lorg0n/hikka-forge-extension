import type { ForgeModuleDef } from '@/types/module';
import UserCommentComponent from './UserCommentComponent';

const userCommentModule: ForgeModuleDef = {
  id: 'user-comments',
  name: 'Модуль коментарів користувача',
  description: 'Додає коментарі користувача до профілю користувача.',
  urlPatterns: ['https://hikka.io/u/*'],
  enabledByDefault: true,
  elementSelector: {
    selector: '#profile-left-side',
    position: 'append',
    index: 0,
  },
  component: UserCommentComponent,
  icon: {
		name: 'mingcute:comment-fill',
		color: '#b649e9'
	},
};

export default userCommentModule;