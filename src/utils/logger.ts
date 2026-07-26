const LOGGING_STORAGE_KEY = "debug_logging_enabled";

type LogMethod = "debug" | "info" | "log" | "warn" | "error" | "trace";

let enabled = false;

function getStorageArea(): typeof browser.storage.sync | undefined {
	return browser.storage?.sync;
}

async function loadEnabledState(): Promise<void> {
	try {
		const storage = getStorageArea();
		if (!storage) return;
		const result = await storage.get(LOGGING_STORAGE_KEY);
		enabled = result[LOGGING_STORAGE_KEY] === true;
	} catch {
	}
}

void loadEnabledState();

browser.storage?.onChanged.addListener((changes, areaName) => {
	if (areaName === "sync" && changes[LOGGING_STORAGE_KEY]) {
		enabled = changes[LOGGING_STORAGE_KEY].newValue === true;
	}
});

function write(method: LogMethod, args: unknown[]): void {
	if (!enabled) return;
	console[method]("[Hikka Forge]", ...args);
}

export const logger = {
	debug: (...args: unknown[]) => write("debug", args),
	info: (...args: unknown[]) => write("info", args),
	log: (...args: unknown[]) => write("log", args),
	warn: (...args: unknown[]) => write("warn", args),
	error: (...args: unknown[]) => write("error", args),
	trace: (...args: unknown[]) => write("trace", args),
};

export function isConsoleLoggingEnabled(): boolean {
	return enabled;
}

export async function getConsoleLoggingEnabled(): Promise<boolean> {
	await loadEnabledState();
	return enabled;
}

export async function setConsoleLoggingEnabled(value: boolean): Promise<void> {
	enabled = value;
	const storage = getStorageArea();
	if (storage) {
		await storage.set({ [LOGGING_STORAGE_KEY]: value });
	}
}
import browser from "@/utils/browser";
