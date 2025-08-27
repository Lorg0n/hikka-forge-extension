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

		const darkGradientStartHex = "#160820";
		const darkBackgroundHex = "#000000";

		const gradientStartHsl = getHslCssValue("darkGradientStartColor", darkGradientStartHex);
		const backgroundHsl = getHslCssValue("backgroundColor", darkBackgroundHex);
		
		const gradientStart = "0%";
		const gradientEnd = "60%";

		return `
      :root {
        --background: ${backgroundHsl};
        --foreground: ${getHslCssValue("foregroundColor", "#FAFAFA")};

        --card: ${getHslCssValue("cardBackgroundColor", "#09090B")};
        --card-foreground: ${getHslCssValue("cardForegroundColor", "#FAFAFA")};

        --popover: ${getHslCssValue("popoverBackgroundColor", "#09090B")};
        --popover-foreground: ${getHslCssValue("popoverForegroundColor", "#FAFAFA")};

        --primary: ${getHslCssValue("primaryBackgroundColor", "#0D0B0D")};
        --primary-foreground: ${getHslCssValue("primaryForegroundColor", "#EC70BB")};
        --primary-border: ${getHslCssValue("primaryBorderColor", "#3A192D")};

        --secondary: ${getHslCssValue("secondaryBackgroundColor", "#272729")};
        --secondary-foreground: ${getHslCssValue("secondaryForegroundColor", "#FAFAFA")};

        --muted: ${getHslCssValue("mutedBackgroundColor", "#272729")};
        --muted-foreground: ${getHslCssValue("mutedForegroundColor", "#A0A0A5")};

        --accent: ${getHslCssValue("accentBackgroundColor", "#272729")};
        --accent-foreground: ${getHslCssValue("accentForegroundColor", "#FAFAFA")};

        --border: ${getHslCssValue("borderColor", "#19191A")};
        --input: ${getHslCssValue("inputColor", "#19191A")};
        --ring: ${getHslCssValue("ringColor", "#D6D6D9")};
        --radius: ${settings.borderRadius || "0.625rem"};

        --sidebar-background: ${getHslCssValue("sidebarBackgroundColor", "#000000")};
        --sidebar-foreground: ${getHslCssValue("sidebarForegroundColor", "#F4F4F6")};
        --sidebar-primary: ${getHslCssValue("sidebarPrimaryColor", "#1B55CC")};
        --sidebar-primary-foreground: ${getHslCssValue("sidebarPrimaryForegroundColor", "#FFFFFF")};
        --sidebar-accent: ${getHslCssValue("sidebarAccentColor", "#272729")};
        --sidebar-accent-foreground: ${getHslCssValue("sidebarAccentForegroundColor", "#F4F4F6")};
        --sidebar-border: ${getHslCssValue("sidebarBorderColor", "#272729")};
        --sidebar-ring: ${getHslCssValue("sidebarRingColor", "#2E96FF")};

        --success: ${getHslCssValue("successBackgroundColor", "#001F0F")};
        --success-foreground: ${getHslCssValue("successForegroundColor", "#74EDAC")};
        --success-border: ${getHslCssValue("successBorderColor", "#002B18")};

        --info: ${getHslCssValue("infoBackgroundColor", "#001A1F")};
        --info-foreground: ${getHslCssValue("infoForegroundColor", "#69C0ED")};
        --info-border: ${getHslCssValue("infoBorderColor", "#002830")};

        --warning: ${getHslCssValue("warningBackgroundColor", "#1F1F00")};
        --warning-foreground: ${getHslCssValue("warningForegroundColor", "#EDC669")};
        --warning-border: ${getHslCssValue("warningBorderColor", "#2A2A00")};

        --destructive: ${getHslCssValue("destructiveBackgroundColor", "#2D0608")};
        --destructive-foreground: ${getHslCssValue("destructiveForegroundColor", "#FFADB3")};
        --destructive-border: ${getHslCssValue("destructiveBorderColor", "#3E080A")};

        --finished-background: var(--success);
        --finished-border: var(--success-border);
        --finished-foreground: var(--success-foreground);

        --ongoing-background: var(--info);
        --ongoing-border: var(--info-border);
        --ongoing-foreground: var(--info-foreground);

        --announced-background: var(--warning);
        --announced-border: var(--warning-border);
        --announced-foreground: var(--warning-foreground);

        --discontinued-background: var(--destructive);
        --discontinued-border: var(--destructive-border);
        --discontinued-foreground: var(--destructive-foreground);

        --paused-background: ${getHslCssValue("pausedBackgroundColor", "#262626")};
        --paused-border: ${getHslCssValue("pausedBorderColor", "#333333")};
        --paused-foreground: ${getHslCssValue("pausedForegroundColor", "#A6A6A6")};
        
        --planned-background: var(--announced-background);
        --planned-border: var(--announced-border);
        --planned-foreground: var(--announced-foreground);

        --completed-background: var(--finished-background);
        --completed-border: var(--finished-border);
        --completed-foreground: var(--finished-foreground);

        --on-hold-background: var(--paused-background);
        --on-hold-border: var(--paused-border);
        --on-hold-foreground: var(--paused-foreground);

        --dropped-background: var(--discontinued-background);
        --dropped-border: var(--discontinued-border);
        --dropped-foreground: var(--discontinued-foreground);

        --reading-background: var(--ongoing-background);
        --reading-border: var(--ongoing-border);
        --reading-foreground: var(--ongoing-foreground);

        --watching-background: var(--ongoing-background);
        --watching-border: var(--ongoing-border);
        --watching-foreground: var(--ongoing-foreground);
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
			id: "backgroundColor",
			label: "Колір фону",
			description: "Основний колір фону сторінки.",
			type: "colorPicker",
			defaultValue: "#000000",
		},
		{
			id: "darkGradientStartColor",
			label: "Колір початку градієнта фону",
			description: "Колір, з якого починається градієнт фону в темній темі.",
			type: "colorPicker",
			defaultValue: "#0d1234",
		},
		{
			id: "foregroundColor",
			label: "Основний колір тексту",
			description: "Основний колір тексту та іконок.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "cardBackgroundColor",
			label: "Колір фону карток",
			description: "Колір фону для карток та контейнерів.",
			type: "colorPicker",
			defaultValue: "#09090B",
		},
		{
			id: "cardForegroundColor",
			label: "Колір тексту карток",
			description: "Колір тексту на картках.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "popoverBackgroundColor",
			label: "Колір фону спливаючих вікон",
			description: "Колір фону для спливаючих елементів.",
			type: "colorPicker",
			defaultValue: "#09090B",
		},
		{
			id: "popoverForegroundColor",
			label: "Колір тексту спливаючих вікон",
			description: "Колір тексту у спливаючих елементах.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "primaryBackgroundColor",
			label: "Основний фон",
			description: "Колір фону для основних елементів.",
			type: "colorPicker",
			defaultValue: "#0D0B0D",
		},
		{
			id: "primaryForegroundColor",
			label: "Основний колір тексту",
			description: "Колір тексту на основних елементах.",
			type: "colorPicker",
			defaultValue: "#7098ec",
		},
		{
			id: "primaryBorderColor",
			label: "Колір рамки основних елементів",
			description: "Колір рамки для основних елементів.",
			type: "colorPicker",
			defaultValue: "#3A192D",
		},
		{
			id: "secondaryBackgroundColor",
			label: "Другорядний фон",
			description: "Колір фону для другорядних елементів.",
			type: "colorPicker",
			defaultValue: "#272729",
		},
		{
			id: "secondaryForegroundColor",
			label: "Другорядний колір тексту",
			description: "Колір тексту на другорядних елементах.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "mutedBackgroundColor",
			label: "Приглушений фон",
			description: "Колір фону для приглушених елементів.",
			type: "colorPicker",
			defaultValue: "#272729",
		},
		{
			id: "mutedForegroundColor",
			label: "Приглушений колір тексту",
			description: "Колір тексту для приглушених елементів.",
			type: "colorPicker",
			defaultValue: "#A0A0A5",
		},
		{
			id: "accentBackgroundColor",
			label: "Акцентний фон",
			description: "Колір фону для акцентних елементів.",
			type: "colorPicker",
			defaultValue: "#272729",
		},
		{
			id: "accentForegroundColor",
			label: "Акцентний колір тексту",
			description: "Колір тексту на акцентних елементах.",
			type: "colorPicker",
			defaultValue: "#FAFAFA",
		},
		{
			id: "destructiveBackgroundColor",
			label: "Фон для руйнівних дій",
			description: "Колір фону для дій, що потребують уваги (напр. видалення).",
			type: "colorPicker",
			defaultValue: "#2D0608",
		},
		{
			id: "destructiveForegroundColor",
			label: "Колір тексту для руйнівних дій",
			description: "Колір тексту на елементах руйнівних дій.",
			type: "colorPicker",
			defaultValue: "#FFADB3",
		},
		{
			id: "destructiveBorderColor",
			label: "Колір рамки для руйнівних дій",
			description: "Колір рамки для елементів руйнівних дій.",
			type: "colorPicker",
			defaultValue: "#3E080A",
		},
		{
			id: "warningBackgroundColor",
			label: "Фон для попереджень",
			description: "Колір фону для попереджувальних повідомлень.",
			type: "colorPicker",
			defaultValue: "#1F1F00",
		},
		{
			id: "warningForegroundColor",
			label: "Колір тексту для попереджень",
			description: "Колір тексту на елементах попереджень.",
			type: "colorPicker",
			defaultValue: "#EDC669",
		},
		{
			id: "warningBorderColor",
			label: "Колір рамки для попереджень",
			description: "Колір рамки для елементів попереджень.",
			type: "colorPicker",
			defaultValue: "#2A2A00",
		},
		{
			id: "successBackgroundColor",
			label: "Фон для успішних дій",
			description: "Колір фону для повідомлень про успіх.",
			type: "colorPicker",
			defaultValue: "#001F0F",
		},
		{
			id: "successForegroundColor",
			label: "Колір тексту для успішних дій",
			description: "Колір тексту на елементах успішних дій.",
			type: "colorPicker",
			defaultValue: "#74EDAC",
		},
		{
			id: "successBorderColor",
			label: "Колір рамки для успішних дій",
			description: "Колір рамки для елементів успішних дій.",
			type: "colorPicker",
			defaultValue: "#002B18",
		},
		{
			id: "infoBackgroundColor",
			label: "Фон для інформаційних повідомлень",
			description: "Колір фону для інформаційних повідомлень.",
			type: "colorPicker",
			defaultValue: "#001A1F",
		},
		{
			id: "infoForegroundColor",
			label: "Колір тексту для інформаційних повідомлень",
			description: "Колір тексту на інформаційних повідомленнях.",
			type: "colorPicker",
			defaultValue: "#69C0ED",
		},
		{
			id: "infoBorderColor",
			label: "Колір рамки для інформаційних повідомлень",
			description: "Колір рамки для інформаційних повідомлень.",
			type: "colorPicker",
			defaultValue: "#002830",
		},
		{
			id: "pausedBackgroundColor",
			label: "Фон для призупинених елементів",
			description: "Колір фону для елементів зі статусом 'Призупинено'.",
			type: "colorPicker",
			defaultValue: "#262626",
		},
		{
			id: "pausedBorderColor",
			label: "Колір рамки для призупинених елементів",
			description: "Колір рамки для елементів зі статусом 'Призупинено'.",
			type: "colorPicker",
			defaultValue: "#333333",
		},
		{
			id: "pausedForegroundColor",
			label: "Колір тексту для призупинених елементів",
			description: "Колір тексту для елементів зі статусом 'Призупинено'.",
			type: "colorPicker",
			defaultValue: "#A6A6A6",
		},
		{
			id: "borderColor",
			label: "Колір рамок",
			description: "Основний колір для рамок та розділювачів.",
			type: "colorPicker",
			defaultValue: "#19191A",
		},
		{
			id: "inputColor",
			label: "Колір полів вводу",
			description: "Колір фону для полів вводу.",
			type: "colorPicker",
			defaultValue: "#19191A",
		},
		{
			id: "ringColor",
			label: "Колір кільця фокусу",
			description: "Колір обводки для елементів у фокусі.",
			type: "colorPicker",
			defaultValue: "#D6D6D9",
		},
		{
			id: "borderRadius",
			label: "Радіус заокруглення",
			description: "Глобальний радіус заокруглення для елементів (напр. '0.625rem').",
			type: "text",
			defaultValue: "0.625rem",
			placeholder: "напр. 0.625rem або 10px",
		},
		{
			id: "sidebarBackgroundColor",
			label: "Фон бічної панелі",
			description: "Колір фону бічної панелі.",
			type: "colorPicker",
			defaultValue: "#000000",
		},
		{
			id: "sidebarForegroundColor",
			label: "Колір тексту бічної панелі",
			description: "Колір тексту та іконок у бічній панелі.",
			type: "colorPicker",
			defaultValue: "#F4F4F6",
		},
		{
			id: "sidebarPrimaryColor",
			label: "Основний колір бічної панелі",
			description: "Акцентний колір для активних елементів бічної панелі.",
			type: "colorPicker",
			defaultValue: "#1B55CC",
		},
		{
			id: "sidebarPrimaryForegroundColor",
			label: "Колір тексту на основному кольорі бічної панелі",
			description: "Колір тексту на активних елементах бічної панелі.",
			type: "colorPicker",
			defaultValue: "#FFFFFF",
		},
		{
			id: "sidebarAccentColor",
			label: "Акцентний колір бічної панелі",
			description: "Колір для акцентних елементів у бічній панелі.",
			type: "colorPicker",
			defaultValue: "#272729",
		},
		{
			id: "sidebarAccentForegroundColor",
			label: "Колір тексту на акцентному кольорі бічної панелі",
			description: "Колір тексту на акцентних елементах бічної панелі.",
			type: "colorPicker",
			defaultValue: "#F4F4F6",
		},
		{
			id: "sidebarBorderColor",
			label: "Колір рамки бічної панелі",
			description: "Колір рамки та розділювачів у бічній панелі.",
			type: "colorPicker",
			defaultValue: "#272729",
		},
		{
			id: "sidebarRingColor",
			label: "Колір кільця фокусу бічної панелі",
			description: "Колір обводки для елементів у фокусі в бічній панелі.",
			type: "colorPicker",
			defaultValue: "#2E96FF",
		},
	],
};

export default customColorsModule;