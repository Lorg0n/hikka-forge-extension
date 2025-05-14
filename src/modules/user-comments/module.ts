import type { ForgeModuleDef } from '@/types/module';
import UserCommentComponent from './UserCommentComponent';

const userCommentModule: ForgeModuleDef = {
  id: 'user-comments',
  name: 'User Comments Module',
  description: 'Adds user comments to the Hikka user profile.',
  urlPatterns: ['https://hikka.io/u/*'],
  elementSelector: {
    selector: 'div.order-2.flex.flex-col.gap-12',
    position: 'append',
  },
  component: UserCommentComponent,
};

export default userCommentModule;