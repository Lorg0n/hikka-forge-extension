// File: /home/lorgon/hikka-forge-extension/src/modules/auth-page/AuthPageComponent.tsx
import React, { useEffect, useState } from 'react';
import { useHikkaCallback } from '@/hooks/useHikkaCallback';
import { AuthService } from '@/services/authService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from '@/components/typography/link';

const AuthPageComponent: React.FC = () => {
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const reference = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('reference')
        : null;

    const { 
        executeCallback, 
        data, 
        loading: callbackLoading, 
        error 
    } = useHikkaCallback();

    // Helper function to handle login logic directly using AuthService
    const handleLogin = async (token: string): Promise<boolean> => {
        try {
            await AuthService.setToken(token);
            // Verify the token by fetching the user
            const currentUser = await AuthService.getCurrentUser();
            
            if (currentUser) {
                return true;
            } else {
                await AuthService.removeToken();
                return false;
            }
        } catch (error) {
            console.error('Login failed:', error);
            await AuthService.removeToken();
            return false;
        }
    };

    // 1. Execute callback when component mounts if reference exists
    useEffect(() => {
        if (reference) {
            executeCallback(reference);
        }
    }, [reference, executeCallback]);

    // 2. Handle successful data reception
    useEffect(() => {
        const processLogin = async () => {
            if (data?.secret) {
                setIsRedirecting(true);
                const success = await handleLogin(data.secret);
                
                if (success) {
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                } else {
                    setIsRedirecting(false);
                    console.error("Failed to verify user after receiving token.");
                }
            }
        };

        if (data) {
            processLogin();
        }
    }, [data]);

    const isLoading = callbackLoading || isRedirecting;

    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 text-center bg-card border border-border">
                
                {/* Header Icon */}
                <div className="rounded-full bg-secondary/20 p-4">
                    {isLoading ? (
                        <Icon icon="eos-icons:loading" className="text-4xl text-primary animate-spin" />
                    ) : error || !reference ? (
                        <Icon icon="material-symbols:error-rounded" className="text-4xl text-destructive" />
                    ) : (
                        <Icon icon="material-symbols:check-circle-rounded" className="text-4xl text-success" />
                    )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-display">
                        {isLoading 
                            ? 'Авторизація...' 
                            : error || !reference 
                                ? 'Помилка авторизації' 
                                : 'Успішно!'}
                    </h1>
                    
                    <p className="text-muted-foreground">
                        {isLoading && 'Перевіряємо ваші дані, зачекайте хвилинку.'}
                        {!reference && !isLoading && 'У посиланні відсутній код авторизації.'}
                        {error && !isLoading && (
                            <span className="text-destructive block mt-2">{error}</span>
                        )}
                        {isRedirecting && 'Вхід виконано. Перенаправляємо на головну...'}
                    </p>
                </div>

                {/* Actions */}
                {!isLoading && (error || !reference) && (
                    <div className="flex gap-4 w-full">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.location.href = '/'}
                        >
                            На головну
                        </Button>
                        {reference && (
                            <Button 
                                className="w-full"
                                onClick={() => executeCallback(reference)}
                            >
                                Спробувати ще
                            </Button>
                        )}
                    </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-4">
                    Hikka Forge Extension &bull; <Link href="https://hikka.io">hikka.io</Link>
                </div>
            </Card>
        </div>
    );
};

export default AuthPageComponent;