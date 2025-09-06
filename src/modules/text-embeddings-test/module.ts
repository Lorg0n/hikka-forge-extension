import type { ForgeModuleDef } from '@/types/module';
import TextEmbeddingsTestComponent from './TextEmbeddingsTestComponent';

const textEmbeddingsTestModule: ForgeModuleDef = {
  id: 'text-embeddings-test',
  name: 'Тестовий модуль ембеддінгів',
  description: 'Тестовий модуль для конвертації тексту в ембеддінг вектори з використанням SentenceTransformer.',
  urlPatterns: ['https://hikka.io/*'],
  enabledByDefault: false,
  elementSelector: {
    selector: 'nav[class="container relative mx-auto flex min-h-16 items-center gap-4 px-4 md:gap-8"] > div[class="flex gap-4"]',
    position: 'prepend',
  },
  component: TextEmbeddingsTestComponent,
  settings: [
    {
      id: 'embeddingModel',
      label: 'Модель ембеддінгів',
      description: 'Модель для генерації ембеддінгів (наприклад, all-MiniLM-L6-v2, all-mpnet-base-v2)',
      type: 'text',
      defaultValue: 'all-MiniLM-L6-v2',
      placeholder: 'Введіть назву моделі',
    },
    {
      id: 'apiEndpoint',
      label: 'API ендпоінт',
      description: 'URL для API ембеддінгів (може бути локальним або віддаленим)',
      type: 'text',
      defaultValue: 'http://localhost:11434',
      placeholder: 'http://localhost:11434 або інший URL',
    },
    {
      id: 'maxTextLength',
      label: 'Максимальна довжина тексту',
      description: 'Максимальна кількість символів для обробки (для оптимізації)',
      type: 'slider',
      min: 128,
      max: 2048,
      step: 128,
      defaultValue: 512,
      unit: 'chars',
    },
    {
      id: 'showRawVectors',
      label: 'Показувати сирі вектори',
      description: 'Відображати необроблені векторні значення в інтерфейсі',
      type: 'toggle',
      defaultValue: false,
    },
    {
      id: 'enableCaching',
      label: 'Увімкнути кешування',
      description: 'Кешувати результати ембеддінгів для покращення продуктивності',
      type: 'toggle',
      defaultValue: true,
    },
    {
      id: 'cacheSize',
      label: 'Розмір кешу',
      description: 'Максимальна кількість закешованих ембеддінгів',
      type: 'slider',
      min: 10,
      max: 1000,
      step: 10,
      defaultValue: 100,
      unit: 'items',
    },
  ],
};

export default textEmbeddingsTestModule;
