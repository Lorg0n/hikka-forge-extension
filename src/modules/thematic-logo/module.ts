import type { ForgeModuleDef } from "@/types/module";
import { getAssetUrl } from "@/utils/asset-utils";

import newYearLightFull from "@/assets/thematic-logos/new-year/logo.svg";
import newYearDarkFull from "@/assets/thematic-logos/new-year/logo-dark.svg";

import halloweenLightFull from "@/assets/thematic-logos/halloween/logo.svg";
import halloweenDarkFull from "@/assets/thematic-logos/halloween/logo-dark.svg";

import easterLightFull from "@/assets/thematic-logos/easter/logo.svg";
import easterDarkFull from "@/assets/thematic-logos/easter/logo-dark.svg";

import independenceDayUaLightFull from "@/assets/thematic-logos/ukraine/logo.svg";
import independenceDayUaDarkFull from "@/assets/thematic-logos/ukraine/logo-dark.svg";

interface ThematicEvent {
	id: string;
	name: string;
	startDate: { month: number; day: number };
	endDate: { month: number; day: number };

	lightLogoFull: string;
	darkLogoFull: string;
}

const thematicEvents: ThematicEvent[] = [
	{
		id: "new-year",
		name: "Новий Рік",
		startDate: { month: 11, day: 15 },
		endDate: { month: 0, day: 21 },
		lightLogoFull: newYearLightFull,
		darkLogoFull: newYearDarkFull,
	},
	{
		id: "halloween",
		name: "Геловін",
		startDate: { month: 9, day: 30 },
		endDate: { month: 10, day: 1 },
		lightLogoFull: halloweenLightFull,
		darkLogoFull: halloweenDarkFull,
	},
	{
		id: "easter",
		name: "Великдень",
		startDate: { month: 2, day: 20 },
		endDate: { month: 4, day: 10 },
		lightLogoFull: easterLightFull,
		darkLogoFull: easterDarkFull,
	},
	{
		id: "ukraine",
		name: "День Незалежності України",
		startDate: { month: 7, day: 23 },
		endDate: { month: 7, day: 25 },
		lightLogoFull: independenceDayUaLightFull,
		darkLogoFull: independenceDayUaDarkFull,
	},
];

const ThematicLogoModule: ForgeModuleDef = {
	id: "thematic-logo",
	name: "Тематичні логотипи",
	enabledByDefault: true,
	description:
		"Змінює основний логотип відповідно до поточного свята або пам'ятної події.",
	urlPatterns: ["https://hikka.io/*"],
	persistentStyles: true,

	styles: () => {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentDay = now.getDate();

		const isCurrentDateWithinRange = (event: ThematicEvent): boolean => {
			const currentNumericalDate = currentMonth * 100 + currentDay;
			const startNumericalDate =
				event.startDate.month * 100 + event.startDate.day;
			const endNumericalDate = event.endDate.month * 100 + event.endDate.day;

			if (startNumericalDate <= endNumericalDate) {
				return (
					currentNumericalDate >= startNumericalDate &&
					currentNumericalDate <= endNumericalDate
				);
			} else {
				return (
					currentNumericalDate >= startNumericalDate ||
					currentNumericalDate <= endNumericalDate
				);
			}
		};

		let cssToInject = "";
		let foundEvent: ThematicEvent | null = null;

		for (const event of thematicEvents) {
			if (isCurrentDateWithinRange(event)) {
				foundEvent = event;
				break;
			}
		}

		if (foundEvent) {
			console.log(
				`[Hikka Forge] Activating thematic full logo for: ${foundEvent.name} (ID: ${foundEvent.id})`
			);

			const lightLogoUrl = getAssetUrl(foundEvent.lightLogoFull);
			const darkLogoUrl = getAssetUrl(foundEvent.darkLogoFull);

			cssToInject = `
                @media (min-width: 768px) {
                    .logo {
                        background-image: url("${lightLogoUrl}") !important;
                    }
                    .dark .logo {
                        background-image: url("${darkLogoUrl}") !important;
                    }
                }
            `;
		} else {
			console.log(
				"[Hikka Forge] No active thematic full logo. Using site defaults for .logo."
			);
		}

		return cssToInject;
	},
	settings: [],
};

export default ThematicLogoModule;