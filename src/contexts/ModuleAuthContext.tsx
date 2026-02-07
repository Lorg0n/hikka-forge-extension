import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { AuthService, UserProfile } from '@/services/authService';

interface ModuleAuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const ModuleAuthContext = createContext<ModuleAuthContextType | undefined>(undefined);

interface ModuleAuthProviderProps {
    children: ReactNode;
}

export const ModuleAuthProvider: React.FC<ModuleAuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = async () => {
        setIsLoading(true);
        try {
            const currentUser = await AuthService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('[Hikka Forge] Failed to load user in module:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUser();

        // Listen for auth changes from storage
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.hikka_forge_auth_token) {
                console.log('[Hikka Forge] Auth token changed, reloading user');
                loadUser();
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    const refreshUser = async () => {
        await loadUser();
    };

    const value: ModuleAuthContextType = {
        user,
        isLoading,
        isAuthenticated: user !== null,
        refreshUser,
    };

    return <ModuleAuthContext.Provider value={value}>{children}</ModuleAuthContext.Provider>;
};

export const useAuth = (): ModuleAuthContextType => {
    const context = useContext(ModuleAuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a ModuleAuthProvider');
    }
    return context;
};