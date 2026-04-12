import type { ForgeModuleDef } from '@/types/module';

const getFontStyles = (settings: Record<string, any>) => {
  const fontUrl = settings.fontUrl || 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap';
  const fontFamily = settings.fontFamily || 'Inter';

  return `
    @import url('${fontUrl}');

    * {
      font-family: '${fontFamily}', sans-serif !important;
    }
  `;
};

const fontOverrideModule: ForgeModuleDef = {
  id: 'font-override',
  name: 'Шрифт',
  description: 'Замінює шрифт сайту на обраний.',
  urlPatterns: ['https://hikka.io/*'],
  styles: getFontStyles,
  persistentStyles: true,
  icon: {
    name: 'lucide:a-large-small',
    color: '#5947ff',
  },
  settings: [
    {
      id: 'fontUrl',
      label: 'URL шрифту (Google Fonts)',
      description: 'Посилання на шрифт з Google Fonts. Відкрийте fonts.google.com → оберіть шрифт → натисніть "Get font" → "Get embed code" → скопіюйте URL з тегу <link href="...">',
      type: 'text',
      defaultValue: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
      placeholder: 'https://fonts.googleapis.com/css2?family=...',
    },
    {
      id: 'fontFamily',
      label: 'Назва шрифту',
      description: 'Точна назва шрифту як вона вказана на Google Fonts. Наприклад: Inter, Roboto, Open Sans, Nunito тощо.',
      type: 'text',
      defaultValue: 'Inter',
      placeholder: 'Inter',
    },
  ],
};

export default fontOverrideModule;