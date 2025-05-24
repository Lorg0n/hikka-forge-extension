import type { ForgeModuleDef } from '@/types/module';

const fontOverrideStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

* {
  font-family: 'Inter', sans-serif !important;
}
`;

const fontOverrideModule: ForgeModuleDef = {
  id: 'font-override',
  name: 'Заміна шрифту (Inter)',
  description: 'Замінює всі шрифти на вебсайті шрифтом Inter, зберігаючи їхню товщину.',
  urlPatterns: ['https://hikka.io/*'],

  styles: fontOverrideStyles,
  persistentStyles: true, 
};

export default fontOverrideModule;
