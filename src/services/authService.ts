import { API_BACKEND_BASE } from '@/constants';

export interface UserProfile {
    id: number;
    username: string;
    hikkaReference: string;
    avatar: string;
    hikkaRole: string;
    hikkaDescription: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

const AUTH_TOKEN_KEY = 'hikka_forge_auth_token';

export class AuthService {
    static async setToken(token: string): Promise<void> {
        await chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token });
    }

    static async getToken(): Promise<string | null> {
        const result = await chrome.storage.local.get(AUTH_TOKEN_KEY);
        return result[AUTH_TOKEN_KEY] || null;
    }

    static async removeToken(): Promise<void> {
        await chrome.storage.local.remove(AUTH_TOKEN_KEY);
    }

    static async getCurrentUser(): Promise<UserProfile | null> {
        const token = await this.getToken();
        if (!token) {
            return null;
        }

        try {
            const response = await fetch(`${API_BACKEND_BASE}/users/me`, {
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token is invalid, remove it
                    await this.removeToken();
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return null;
        }
    }

    static async logout(): Promise<void> {
        await this.removeToken();
    }

    static async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        if (!token) return false;

        // Verify token is valid by fetching user
        const user = await this.getCurrentUser();
        return user !== null;
    }
}