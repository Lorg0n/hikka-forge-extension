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

	return `${h}, ${s}%, ${l}%`;
}

const customColorsModule: ForgeModuleDef = {
	id: "custom-colors",
	name: "Кастомні кольори",
	description: "Дозволяє змінити кольори сайту на свої",
	urlPatterns: ["https://hikka.io/*"],
	styles: (settings) => {
		const primaryHexColor = settings.primaryColor || "#3B88C4";

		const primaryHslComponents = hexToHsl(primaryHexColor);

		const primaryHslVariable = primaryHslComponents.replace(/,/g, "");

		const gradientStart = "0%";
		const gradientEnd = "60%";

		return `
      :root {
        --primary: ${primaryHslVariable};
      }
      body {
        background-image: linear-gradient(
            180deg,
            hsl(${primaryHslComponents}) ${gradientStart},
            #000 ${gradientEnd},
            #000 100%
        ) !important;
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
	],
};

export default customColorsModule;
