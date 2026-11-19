import type { ForgeModuleDef } from '@/types/module';
import NotificationsView from './NotificationsView';
const moduleDef: ForgeModuleDef = {
    id: 'notifications-view', name: 'Сторінка сповіщень', description: 'Перегляд сповіщень',
    hidden: true, dependsOn: 'notifications-page', enabledByDefault: true,
    urlPatterns: ['https://hikka.io/#notifications', 'https://dev.hikka.io/#notifications'],
    elementSelector: { selector: 'main', position: 'replace' }, component: NotificationsView,
};
export default moduleDef;
