import type { ForgeModuleDef } from '@/types/module';
import NotificationsButton from './NotificationsButton';

const moduleDef: ForgeModuleDef = {
    id: 'notifications-page', name: 'Сторінка сповіщень',
    description: 'Замінює спливаюче вікно сповіщень окремою сторінкою',
    beta: true, enabledByDefault: false, persistent: true, category: 'content',
    urlPatterns: ['https://hikka.io/*', 'https://hikka.io', 'https://dev.hikka.io/*', 'https://dev.hikka.io'],
    elementSelector: { selector: 'body', position: 'append', hostWidth: 'auto' },
    settings: [{ id: 'groupNotifications', label: 'Групувати схожі', type: 'toggle', defaultValue: false }],
    component: NotificationsButton, icon: { name: 'lucide:bell', color: '#f59e0b' },
};
export default moduleDef;
