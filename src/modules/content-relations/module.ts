import type { ForgeModuleDef } from '@/types/module';
import ContentRelationsButton from './ContentRelationsButton';

const contentRelationsModule: ForgeModuleDef = {
    id: 'content-relations',
    name: 'Граф франшизи',
    description: 'Додає вкладку Hikka Forge з інтерактивним графом зв’язків на сторінці франшизи.',
    urlPatterns: [
        'https://hikka.io/anime/*/franchise*=',
        'https://hikka.io/manga/*/franchise*=',
        'https://dev.hikka.io/anime/*/franchise*=',
        'https://dev.hikka.io/manga/*/franchise*=',
    ],
    enabledByDefault: true,
    // Switching franchise views updates the URL but should not tear down the
    // injected tab. The component synchronizes with Hikka's refreshed tablist.
    persistent: true,
    category: 'content',
    elementSelector: {
        selector: 'div[role="tablist"]:has(> a[role="tab"][href*="/franchise"])',
        position: 'append',
        hostWidth: 'auto',
        initiallyHidden: true,
    },
    component: ContentRelationsButton,
    icon: {
        name: 'lucide:workflow',
        color: '#a78bfa',
    },
};

export default contentRelationsModule;
