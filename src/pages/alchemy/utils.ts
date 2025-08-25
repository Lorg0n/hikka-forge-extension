import { AlchemyItem, AnimeItem, AlchemyElementItem, AnimeCombinationResultItem } from '@/types';

/**
 * Generate a unique identifier
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Map API element to alchemy item
 */
export const mapApiElementToAlchemyItem = (apiElement: AlchemyElementItem): AlchemyItem => ({
  type: 'alchemy_element',
  id: apiElement.id,
  uniqueId: `element-${apiElement.id}`,
  name: apiElement.name,
  imageUrl: apiElement.imageUrl,
});

/**
 * Map API anime to anime item
 */
export const mapApiAnimeToAnimeItem = (apiAnime: AnimeCombinationResultItem): AnimeItem => ({
  type: 'anime',
  slug: apiAnime.slug,
  uniqueId: `anime-${apiAnime.slug}`,
  name: apiAnime.titleEn || apiAnime.titleNative,
  imageUrl: apiAnime.imageUrl,
});

/**
 * Get corrected position within workspace bounds
 */
export const getCorrectedPosition = (
  x: number,
  y: number,
  workspaceRect?: DOMRect,
  elementSize = { width: 96, height: 128 }
): { x: number; y: number } => {
  if (!workspaceRect) {
    return { x: Math.max(0, x), y: Math.max(0, y) };
  }

  const maxX = workspaceRect.width - elementSize.width;
  const maxY = workspaceRect.height - elementSize.height;

  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
};

/**
 * Check if two items can be combined
 */
export const canCombineItems = (item1: { type: string }, item2: { type: string }): boolean => {
  // Anime can be combined with anime, different types can be combined
  return (item1.type === 'anime' && item2.type === 'anime') || (item1.type !== item2.type);
};

/**
 * Format notification message for combinations
 */
export const formatCombinationMessage = (itemName: string, isDiscovery: boolean): string => {
  if (isDiscovery) {
    return `🎉 Нове відкриття! Знайдено: ${itemName}`;
  }
  return `Створено: ${itemName}`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get element center position
 */
export const getElementCenter = (rect: DOMRect): { x: number; y: number } => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

/**
 * Calculate distance between two points
 */
export const getDistance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};