// All possible elements in the game
export interface GameElement {
  id: string;
  name: string; // Назва елемента
  emoji: string; // Emoji для візуалізації
}

export const ELEMENTS: Record<string, GameElement> = {
  // --- Starter Elements (Початкові елементи) ---
  anime: { id: "anime", name: "Аніме", emoji: "🌸" },
  shonen: { id: "shonen", name: "Шьонен", emoji: "🔥" },
  shojo: { id: "shojo", name: "Шьоджьо", emoji: "💖" },
  isekai: { id: "isekai", name: "Ісекай", emoji: "🚚" },

  // --- Anime Titles (Аніме-тайтли) ---
  naruto: { id: "naruto", name: "Наруто", emoji: "🍥" },
  sailor_moon: { id: "sailor_moon", name: "Сейлор Мун", emoji: "🌙" },
  konosuba: { id: "konosuba", name: "Коносуба", emoji: "💥" },

  // --- Results (Результати змішування) ---
  friendship: { id: "friendship", name: "Дружба", emoji: "🤝" },
  magic_girl: { id: "magic_girl", name: "Дівчинка-чарівниця", emoji: "✨" },
  truck_kun: { id: "truck_kun", name: "Вантажівка-кун", emoji: "🚛" },
  adventure_guild: { id: "adventure_guild", name: "Гільдія авантюристів", emoji: "🗺️" },
};