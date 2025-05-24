import type { ForgeModuleDef } from '@/types/module';

const fontOverrideStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

* {
  font-family: 'Inter', sans-serif !important;
}
`;

const fontOverrideModule: ForgeModuleDef = {
  id: 'font-override',
  name: 'Font Replacement (Inter)',
  description: 'Replaces all fonts on the website with Inter, preserving font weights.',
  urlPatterns: ['https://hikka.io/*'],

  styles: fontOverrideStyles,
  persistentStyles: true, 
};

export default fontOverrideModule;
