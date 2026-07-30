import type { ForgeModuleDef } from '@/types/module';

import MobileUserRecommendationsComponent from '../user-recommendations/MobileUserRecommendationsComponent';

const mobileUserRecommendationsModule: ForgeModuleDef = {
    id: 'mobile-user-recommendations',
    name: 'Мобільні рекомендації',
    description: 'Показує персональні рекомендації у мобільному списку віджетів.',
    dependsOn: 'user-recommendations',
    urlPatterns: ['https://hikka.io/*', 'https://hikka.io', 'https://dev.hikka.io/*', 'https://dev.hikka.io'],
    enabledByDefault: true,
    hidden: true,
    authRequired: true,
    category: 'recommendations',
    elementSelector: {
        // Mount after the horizontal rail, not after the tablist itself;
        // the tablist is nested inside the rail and the panel must be a
        // vertical sibling of that rail.
        selector: 'div.no-scrollbar:has(> div[role="tablist"][aria-label="Віджети"])',
        position: 'after',
        // The nested tablist uses `display: contents`, so do not require an
        // offsetParent while locating this mobile-only rail.
        visibleOnly: false,
        hostWidth: '100%',
        initiallyHidden: true,
    },
    component: MobileUserRecommendationsComponent,
    icon: {
        name: 'lucide:sparkles',
        color: '#22d3ee',
    },
};

export default mobileUserRecommendationsModule;
