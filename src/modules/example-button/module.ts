
import type { ForgeModuleDef } from '@/types/module';
import ExampleButtonComponent from './ExampleButtonComponent';

const exampleButtonModule: ForgeModuleDef = {
  id: 'example-button',
  name: 'Example Button Module',
  description: 'Adds an example Shadcn button below the anime title.',
  urlPatterns: ['https://hikka.io/anime/*'],
  elementSelector: {
    selector: 'div.flex.justify-between.gap-4',
    position: 'after',
  },
  component: ExampleButtonComponent,
};

export default exampleButtonModule;