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
    host_permissions: ["https://hikka.io/*", "https://hikka-forge.lorgon.dev/*"],
    content_scripts: [
        {
            matches: ["https://hikka.io/*"],
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

    try {
        const packageJson = require('../../package.json');
        base.version = packageJson.version;
    } catch (e) {
        console.warn('Could not read version from package.json');
    }

    if (browser === 'firefox') {
        return {
            ...base,
            background: {
                scripts: ["src/background.js"],
            },
            browser_specific_settings: {
                gecko: {
                    id: "forge@hikka.io",
                    strict_min_version: "109.0",
                },
            },
        };
    }

    return {
        ...base,
        background: {
            service_worker: "src/background.js",
        },
    };
};