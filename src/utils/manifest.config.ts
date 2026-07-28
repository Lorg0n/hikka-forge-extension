import { createRequire } from "node:module";

const loadJson = createRequire(import.meta.url);

const getBaseManifest = () => ({
    manifest_version: 3,
    name: "Hikka Forge",
    version: "null", 
    description: "Unlock custom features and personalized styles for Hikka with this extension.",
    action: {
        default_popup: "src/pages/popup/popup.html",
        default_icon: {
            16: "assets/icon16.png",
            48: "assets/icon48.png",
            128: "assets/icon128.png",
        },
    },
    permissions: [
        "storage",
        "webNavigation",
        "tabs",
    ],
    host_permissions: ["https://dev.hikka.io/*", "https://api.hikka.io/*", "https://hikka-forge.lorgon.dev/*"],
    content_scripts: [
        {
            matches: ["https://dev.hikka.io/*", "https://hikka-forge.lorgon.dev/*"],
            js: ["src/content_loader.js"],
            run_at: "document_idle",
        },
    ],
    web_accessible_resources: [
        {
            resources: [
                "src/content.js",
                "src/*.js",
                "assets/*"
            ],
            matches: ["<all_urls>"],
        },
    ],
    icons: {
        16: "assets/icon16.png",
        48: "assets/icon48.png",
        128: "assets/icon128.png",
    },
});

export const generateManifest = (browser: string) => {
    const base = getBaseManifest();

    const packageJson = loadJson('../../package.json') as { version: string };
    base.version = packageJson.version;

    if (browser === 'firefox') {
        return {
            ...base,
            background: {
                scripts: ["src/background.js"],
                type: "module",
            },
            browser_specific_settings: {
                gecko: {
                    id: "forge@hikka.io",
                    strict_min_version: "109.0",
                },
                gecko_android: {}
            },
        };
    }

    return {
        ...base,
        background: {
            service_worker: "src/background.js",
            type: "module",
        },
    };
};
