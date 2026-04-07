import type { ForgeModuleDef } from '@/types/module';

const removeNewsIndentModule: ForgeModuleDef = {
    id: 'remove-news-indent',
    name: 'Прибрати відступ елементів новин',
    description: 'Прибирає лівий відступ (margin) у елементів стрічки новин, роблячи їх на всю ширину.',
    urlPatterns: ['https://hikka.io/*', 'https://hikka.io/'],
    enabledByDefault: false,
    persistentStyles: true,
    styles: `
        .feed-item > .feed-item-content {
            margin-left: 0 !important;
        }
    `,
};

export default removeNewsIndentModule;