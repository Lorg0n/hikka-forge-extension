import type { ForgeModuleDef } from "@/types/module";

function hexToHsl(hex: string): string {
	let r = 0,
		g = 0,
		b = 0;

	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	} else if (hex.length === 7) {
		r = parseInt(hex.substring(1, 3), 16);
		g = parseInt(hex.substring(3, 5), 16);
		b = parseInt(hex.substring(5, 7), 16);
	} else {
		console.warn(`[Hikka Forge] Invalid HEX color format: ${hex}`);
		return "0, 0%, 0%"; 
	}

	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	h = Math.round(h * 360);
	s = Math.round(s * 100);
	l = Math.round(l * 100);

    h = isNaN(h) ? 0 : Math.max(0, Math.min(360, h));
    s = isNaN(s) ? 0 : Math.max(0, Math.min(100, s));
    l = isNaN(l) ? 0 : Math.max(0, Math.min(100, l));

	return `${h}, ${s}%, ${l}%`;
}

const customColorsModule: ForgeModuleDef = {
	id: "theme-customizer",
	name: "Розширені налаштування теми",
	description:
		"Дозволяє змінити візуальну тему сайту, включаючи кольори та заокруглення.",
	urlPatterns: ["https://hikka.io/*"],
	styles: (settings) => {
		const getHslCssValue = (
			settingId: string,
			defaultValue: string
		): string => {
			const hexColor = settings[settingId] || defaultValue;
			return hexToHsl(hexColor).replace(/,/g, " ");
		};

		const primaryHsl = getHslCssValue("primaryColor", "#3B88C4");
		const backgroundHsl = getHslCssValue("backgroundColor", "#000000");
		
		const gradientStartHsl = getHslCssValue("gradientStartColor", "#0f1629");

		const gradientStart = "0%";
		const gradientEnd = "60%";

		return `
      :root {
        --background: ${getHslCssValue("backgroundColor", "#000000")};
        --foreground: ${getHslCssValue("foregroundColor", "#FAFAFA")};

        --card: ${getHslCssValue("cardColor", "#0A0A0B")};
        --card-foreground: var(--foreground);

        --popover: var(--card);
        --popover-foreground: var(--foreground);

        --primary: ${primaryHsl};
        --primary-foreground: ${getHslCssValue(
					"primaryForegroundColor",
					"#050004"
				)};

        --secondary: ${getHslCssValue("secondaryColor", "#28282B")};
        --secondary-foreground: var(--foreground);

        --muted: var(--secondary);
        --muted-foreground: ${getHslCssValue(
					"mutedForegroundColor",
					"#A0A0A9"
				)};

        --accent: var(--secondary);
        --accent-foreground: var(--foreground); 

        --destructive: ${getHslCssValue("destructiveColor", "#CA3137")};
        --destructive-foreground: ${getHslCssValue(
					"destructiveForegroundColor",
					"#FFFFFF"
				)};

        --warning: ${getHslCssValue("warningColor", "#FAAD14")};
        --warning-foreground: var(--background);

        --success: ${getHslCssValue("successColor", "#4FD18C")};
        --success-foreground: var(--background);

        --info: ${getHslCssValue("infoColor", "#3399FF")};
        --info-foreground: var(--background);

        --border: ${getHslCssValue("borderColor", "#19191A")};
        --input: var(--border); 
        --ring: ${getHslCssValue("ringColor", "#D5D7DA")};
        --radius: ${settings.borderRadius || "0.625rem"}; 

        --sidebar-background: var(--background); 
        --sidebar-foreground: ${getHslCssValue(
					"sidebarForegroundColor",
					"#F0F2F5"
				)};
        --sidebar-primary: ${getHslCssValue("sidebarPrimaryColor", "#1B44C1")};
        --sidebar-primary-foreground: var(--destructive-foreground); 
        --sidebar-accent: var(--secondary); 
        --sidebar-accent-foreground: var(--sidebar-foreground); 
        --sidebar-border: var(--secondary);
        --sidebar-ring: ${getHslCssValue("sidebarRingColor", "#2C85FF")};
      }
      body {
        background-image: linear-gradient(
            180deg,
            hsl(${gradientStartHsl}) ${gradientStart}, 
            hsl(${backgroundHsl}) ${gradientEnd}, 
            hsl(${backgroundHsl}) 100%
        ) !important;
      }
      .no-gradient {
            background-image: none !important;
        }
    `;
	},
	persistentStyles: true,
	settings: [
		{
			id: "primaryColor",
			label: "Основний колір",
			description: "Виберіть основний акцентний колір для інтерфейсу.",
			type: "colorPicker",
			defaultValue: "#3B88C4",
		},
		{
			id: "backgroundColor",
			label: "Колір фону",
			description: "Основний колір фону.",
			type: "colorPicker",
			defaultValue: "#000000",
		},
		{
			id: "gradientStartColor",
			label: "Початковий колір градієнта фону",
			description: "Виберіть колір, з якого починається градієнт фону.",
			type: "colorPicker",
			defaultValue: "#050e2a",
		},
		{
			id: "foregroundColor",
			label: "Колір тексту",
			description: "Основний колір тексту інтерфейсу.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "cardColor",
			label: "Колір карток",
			description: "Колір фону елементів карток та спливаючих вікон.",
			type: "colorPicker",
			defaultValue: "#0A0A0B",
		},
		{
			id: "primaryForegroundColor",
			label: "Колір тексту акцентного елементу",
			description: "Колір тексту, що розміщений на акцентному кольорі.",
			type: "colorPicker",
			defaultValue: "#050004",
		},
		{
			id: "secondaryColor",
			label: "Другорядний колір",
			description: "Другорядний колір інтерфейсу.",
			type: "colorPicker",
			defaultValue: "#28282B",
		},
		{
			id: "mutedForegroundColor",
			label: "Приглушений колір тексту",
			description: "Колір приглушеного тексту або іконок.",
			type: "colorPicker",
			defaultValue: "#A0A0A9",
		},
		{
			id: "destructiveColor",
			label: "Колір руйнівних дій",
			description: "Колір для попереджень або небезпечних дій.",
			type: "colorPicker",
			defaultValue: "#CA3137",
		},
		{
			id: "destructiveForegroundColor",
			label: "Колір тексту руйнівних дій",
			description: "Колір тексту, що розміщений на руйнівному кольорі.",
			type: "colorPicker",
			defaultValue: "#FFFFFF",
		},
		{
			id: "warningColor",
			label: "Колір попереджень",
			description: "Колір для попереджувальних повідомлень.",
			type: "colorPicker",
			defaultValue: "#FAAD14",
		},
		{
			id: "successColor",
			label: "Колір успіху",
			description: "Колір для повідомлень про успіх.",
			type: "colorPicker",
			defaultValue: "#4FD18C",
		},
		{
			id: "infoColor",
			label: "Колір інформації",
			description: "Колір для інформаційних повідомлень.",
			type: "colorPicker",
			defaultValue: "#3399FF",
		},
		{
			id: "borderColor",
			label: "Колір рамок",
			description: "Колір рамок та ліній розділу.",
			type: "colorPicker",
			defaultValue: "#19191A",
		},
		{
			id: "ringColor",
			label: "Колір обідка (ring)",
			description: "Колір обідка для фокусу або валідації.",
			type: "colorPicker",
			defaultValue: "#D5D7DA",
		},
		{
			id: "borderRadius",
			label: "Радіус заокруглення",
			description:
				"Глобальний радіус заокруглення елементів (наприклад, '0.625rem').",
			type: "text",
			defaultValue: "0.625rem",
			placeholder: "наприклад, 0.625rem або 10px",
		},
		{
			id: "sidebarForegroundColor",
			label: "Колір тексту бічної панелі",
			description: "Колір тексту та іконок у бічній панелі.",
			type: "colorPicker",
			defaultValue: "#F0F2F5",
		},
		{
			id: "sidebarPrimaryColor",
			label: "Основний колір бічної панелі",
			description: "Акцентний колір для елементів у бічній панелі.",
			type: "colorPicker",
			defaultValue: "#1B44C1",
		},
		{
			id: "sidebarRingColor",
			label: "Колір обідка бічної панелі",
			description: "Колір обідка для елементів бічної панелі.",
			type: "colorPicker",
			defaultValue: "#2C85FF",
		},
	],
};

export default customColorsModule;