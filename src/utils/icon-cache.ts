import {
	addCollection,
	setCustomIconsLoader,
} from "@iconify/react/dist/iconify.js";
import browser from "@/utils/browser";

type IconifyCollection = Parameters<typeof addCollection>[0];
type CollectionCache = Record<string, IconifyCollection>;

const CACHE_KEY = "iconifyCollectionCacheV1";
const API_RESOURCES = [
	"https://api.iconify.design",
	"https://api.simplesvg.com",
	"https://api.unisvg.com",
];

// Iconify does not persist its in-memory cache when an extension popup closes.
// Register loaders for every collection used by the extension so all extension
// contexts can share the same durable browser.storage.local cache.
const CACHED_PREFIXES = [
	"bxs",
	"fe",
	"iconamoon",
	"lucide",
	"material-symbols",
	"svg-spinners",
];

let collections: CollectionCache = {};
let initialized = false;
let writeQueue: Promise<void> = Promise.resolve();

function isCollection(value: unknown): value is IconifyCollection {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Partial<IconifyCollection>;
	return (
		typeof candidate.prefix === "string" &&
		Boolean(candidate.icons) &&
		typeof candidate.icons === "object"
	);
}

function mergeCollection(
	current: IconifyCollection | undefined,
	incoming: IconifyCollection
): IconifyCollection {
	if (!current) return incoming;

	return {
		...current,
		...incoming,
		icons: { ...current.icons, ...incoming.icons },
		aliases: { ...current.aliases, ...incoming.aliases },
		not_found: Array.from(
			new Set([...(current.not_found ?? []), ...(incoming.not_found ?? [])])
		),
	};
}

async function fetchCollection(
	prefix: string,
	names: string[]
): Promise<IconifyCollection | null> {
	const query = new URLSearchParams({ icons: names.join(",") });

	for (const resource of API_RESOURCES) {
		try {
			const response = await fetch(
				`${resource}/${encodeURIComponent(prefix)}.json?${query.toString()}`
			);
			if (!response.ok) continue;

			const data: unknown = await response.json();
			if (isCollection(data) && data.prefix === prefix) return data;
		} catch {
			// Try the next Iconify mirror.
		}
	}

	return null;
}

function persistCollections(): Promise<void> {
	writeQueue = writeQueue
		.catch(() => undefined)
		.then(() => browser.storage.local.set({ [CACHE_KEY]: collections }));
	return writeQueue;
}

const cacheReady = (async () => {
	try {
		const stored = await browser.storage.local.get(CACHE_KEY);
		const cached = stored[CACHE_KEY];
		if (!cached || typeof cached !== "object") return;

		for (const [prefix, collection] of Object.entries(cached)) {
			if (!isCollection(collection) || collection.prefix !== prefix) continue;
			collections[prefix] = collection;
			addCollection(collection);
		}
	} catch {
		// Icons can still be loaded from the network if extension storage fails.
	}
})();

async function loadAndCacheIcons(
	names: string[],
	prefix: string
): Promise<IconifyCollection | null> {
	await cacheReady;

	const cached = collections[prefix];
	const cachedNames = new Set([
		...Object.keys(cached?.icons ?? {}),
		...Object.keys(cached?.aliases ?? {}),
		...(cached?.not_found ?? []),
	]);
	const missingNames = names.filter((name) => !cachedNames.has(name));

	if (!missingNames.length) return cached ?? null;

	const downloaded = await fetchCollection(prefix, missingNames);
	if (!downloaded) return null;

	collections[prefix] = mergeCollection(cached, downloaded);
	await persistCollections().catch(() => undefined);
	return collections[prefix];
}

/**
 * Enables a persistent Iconify cache and restores previously downloaded icons.
 * Safe to call from every extension entry point and more than once.
 */
export async function initializeIconCache(): Promise<void> {
	if (!initialized) {
		initialized = true;
		for (const prefix of CACHED_PREFIXES) {
			setCustomIconsLoader(loadAndCacheIcons, prefix);
		}
	}

	await cacheReady;
}
