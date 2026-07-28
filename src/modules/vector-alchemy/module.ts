import type { ForgeModuleDef } from '@/types/module';

const vectorAlchemyModule: ForgeModuleDef = {
    id: 'vector-alchemy',
    name: 'Векторна алхімія',
    description: 'Поєднуйте елементи та тайтли у мапі відкриттів.',
    urlPatterns: ['https://dev.hikka.io/*'],
    enabledByDefault: true,
    category: 'other',
    icon: { name: 'material-symbols:science-outline', color: '#a78bfa' },
    popupAction: { label: 'Відкрити', href: '/#alchemy' },
};

export default vectorAlchemyModule;
