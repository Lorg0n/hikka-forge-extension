const TELEGRAM_AUTH_FLOW_STORAGE_KEY = 'hikka_auth_flow';

interface TelegramAuthFlow {
    type: 'telegram';
    expiresAt: number;
}

const isTelegramAuthFlow = (value: unknown): value is TelegramAuthFlow => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const flow = value as Record<string, unknown>;
    return flow.type === 'telegram'
        && typeof flow.expiresAt === 'number'
        && Number.isFinite(flow.expiresAt);
};

/**
 * Determines whether the login page owns authentication through Telegram.
 * Storage access is intentionally best-effort so it cannot interrupt the
 * extension's established authorization flow.
 */
export const isTelegramAuthFlowActive = (): boolean => {
    if (document.documentElement.dataset.hikkaForgeAuthFlow === 'telegram') {
        return true;
    }

    try {
        const serializedFlow = window.sessionStorage.getItem(TELEGRAM_AUTH_FLOW_STORAGE_KEY);
        if (!serializedFlow) {
            return false;
        }

        const flow: unknown = JSON.parse(serializedFlow);
        if (!isTelegramAuthFlow(flow)) {
            return false;
        }

        if (flow.expiresAt <= Date.now()) {
            try {
                window.sessionStorage.removeItem(TELEGRAM_AUTH_FLOW_STORAGE_KEY);
            } catch {
                // Session storage can be unavailable on restricted pages.
            }
            return false;
        }

        return true;
    } catch {
        return false;
    }
};
