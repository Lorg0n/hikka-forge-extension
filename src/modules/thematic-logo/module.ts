import { logger } from "@/utils/logger";
import type { ForgeModuleDef, ModuleSettings } from "@/types/module";
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
	scheduleLabel: string;
	startDate?: { month: number; day: number };
	endDate?: { month: number; day: number };

	lightLogoFull: string;
	darkLogoFull: string;
}

const thematicEvents: ThematicEvent[] = [
	{
		id: "new-year",
		name: "Новий Рік",
		scheduleLabel: "15 грудня — 21 січня",
		startDate: { month: 11, day: 15 },
		endDate: { month: 0, day: 21 },
		lightLogoFull: newYearLightFull,
		darkLogoFull: newYearDarkFull,
	},
	{
		id: "halloween",
		name: "Геловін",
		scheduleLabel: "30 жовтня — 1 листопада",
		startDate: { month: 9, day: 30 },
		endDate: { month: 10, day: 1 },
		lightLogoFull: halloweenLightFull,
		darkLogoFull: halloweenDarkFull,
	},
	{
		id: "ukraine",
		name: "День Незалежності України",
		scheduleLabel: "23 — 25 серпня",
		startDate: { month: 7, day: 23 },
		endDate: { month: 7, day: 25 },
		lightLogoFull: independenceDayUaLightFull,
		darkLogoFull: independenceDayUaDarkFull,
	},
];

const easterEvent: ThematicEvent = {
	id: "easter",
	name: "Великдень",
	scheduleLabel: "За 2 дні до та після католицького або православного Великодня",
	lightLogoFull: easterLightFull,
	darkLogoFull: easterDarkFull,
};

function getCatholicEaster(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
	const day = ((h + l - 7 * m + 114) % 31) + 1;

	return new Date(year, month, day);
}

function getOrthodoxEaster(year: number): Date {
	const a = year % 4;
	const b = year % 7;
	const c = year % 19;
	const d = (19 * c + 15) % 30;
	const e = (2 * a + 4 * b - d + 34) % 7;
	const month = Math.floor((d + e + 114) / 31) - 1;
	const day = ((d + e + 114) % 31) + 1;
	const julianToGregorianOffset =
		Math.floor(year / 100) - Math.floor(year / 400) - 2;

	return new Date(year, month, day + julianToGregorianOffset);
}

function isWithinDays(date: Date, target: Date, days: number): boolean {
	const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	const event = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

	return Math.abs(current - event) <= days * 24 * 60 * 60 * 1000;
}

function isEasterPeriod(date: Date): boolean {
	const year = date.getFullYear();

	return [getCatholicEaster(year), getOrthodoxEaster(year)].some((easter) =>
		isWithinDays(date, easter, 2)
	);
}

const allThematicEvents = [...thematicEvents, easterEvent];
const MANUAL_SELECTION_SETTING_ID = "manualEventId";
const AUTOMATIC_SELECTION = "automatic";

function calendarEnabledSettingId(eventId: string): string {
	return `calendarEnabled_${eventId}`;
}

function isEventActive(event: ThematicEvent, date: Date): boolean {
	if (event.id === easterEvent.id) return isEasterPeriod(date);
	if (!event.startDate || !event.endDate) return false;

	const currentNumericalDate = date.getMonth() * 100 + date.getDate();
	const startNumericalDate = event.startDate.month * 100 + event.startDate.day;
	const endNumericalDate = event.endDate.month * 100 + event.endDate.day;

	return startNumericalDate <= endNumericalDate
		? currentNumericalDate >= startNumericalDate && currentNumericalDate <= endNumericalDate
		: currentNumericalDate >= startNumericalDate || currentNumericalDate <= endNumericalDate;
}

function getActiveEventIds(date = new Date()): string[] {
	return allThematicEvents.filter((event) => isEventActive(event, date)).map(({ id }) => id);
}

function getSelectedEvent(settings: ModuleSettings, date = new Date()): ThematicEvent | undefined {
	const manualSelection = settings[MANUAL_SELECTION_SETTING_ID];
	if (typeof manualSelection === "string" && manualSelection !== AUTOMATIC_SELECTION) {
		return allThematicEvents.find((event) => event.id === manualSelection);
	}

	return allThematicEvents.find(
		(event) => settings[calendarEnabledSettingId(event.id)] !== false && isEventActive(event, date),
	);
}

const ThematicLogoModule: ForgeModuleDef = {
	id: "thematic-logo",
	name: "Тематичні логотипи",
	enabledByDefault: true,
	description:
		"Змінює основний логотип відповідно до поточного свята або пам'ятної події.",
	urlPatterns: ["https://hikka.io/*", "https://dev.hikka.io/*"],
	persistentStyles: true,
	category: "appearance",

	icon: {
		name: 'lucide:palette',
		color: '#fb923c'
	},

	styles: (settings) => {
		let cssToInject = "";
		const foundEvent = getSelectedEvent(settings);

		if (foundEvent) {
			logger.log(
				`[Hikka Forge] Activating thematic full logo for: ${foundEvent.name} (ID: ${foundEvent.id})`
			);

			const lightLogoUrl = getAssetUrl(foundEvent.lightLogoFull);
			const darkLogoUrl = getAssetUrl(foundEvent.darkLogoFull);

			cssToInject = `
                .logo,
                .logo-full {
                    background-image: url("${lightLogoUrl}") !important;
                }
                .dark .logo,
                .dark .logo-full {
                    background-image: url("${darkLogoUrl}") !important;
                }
            `;
		} else {
			logger.log(
				"[Hikka Forge] No active thematic full logo. Using site defaults for .logo."
			);
		}

		return cssToInject;
	},
	thematicSchedule: {
		manualSelectionSettingId: MANUAL_SELECTION_SETTING_ID,
		automaticValue: AUTOMATIC_SELECTION,
		items: allThematicEvents.map((event) => ({
			id: event.id,
			label: event.name,
			scheduleLabel: event.scheduleLabel,
			calendarEnabledSettingId: calendarEnabledSettingId(event.id),
		})),
	},
	getActiveThematicItemIds: getActiveEventIds,
	settings: [
		{
			id: MANUAL_SELECTION_SETTING_ID,
			label: "Ручний вибір тематики",
			type: "select",
			defaultValue: AUTOMATIC_SELECTION,
			options: [
				{ value: AUTOMATIC_SELECTION, label: "За календарем" },
				...allThematicEvents.map((event) => ({ value: event.id, label: event.name })),
			],
		},
		...allThematicEvents.map((event) => ({
			id: calendarEnabledSettingId(event.id),
			label: `Включати ${event.name} за календарем`,
			type: "toggle" as const,
			defaultValue: true,
		})),
	],
};

export default ThematicLogoModule;
