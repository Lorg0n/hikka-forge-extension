import React, { useEffect, useState } from 'react';
import { useHikkaCallback } from '@/hooks/useHikkaCallback';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';

const AuthPageComponent: React.FC = () => {
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const reference = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('reference') 
        : null;

    const { executeCallback, data, loading, error } = useHikkaCallback();

    useEffect(() => {
        if (reference) executeCallback(reference);
    }, [reference, executeCallback]);

    useEffect(() => {
        if (data?.secret) {
            setIsRedirecting(true);
            AuthService.setToken(data.secret).then(async () => {
                if (await AuthService.getCurrentUser()) {
                    setTimeout(() => window.location.href = '/', 800);
                } else {
                    await AuthService.removeToken();
                    setIsRedirecting(false);
                }
            });
        }
    }, [data]);

    const isLoading = loading || isRedirecting;
    let description = "Перевірка...";
    
    if (isRedirecting) description = "Вхід виконано. Перенаправлення...";
    else if (error) description = error;
    else if (!reference) description = "Відсутній код авторизації";

    const showRetry = !!error && !!reference;

    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center">
            <div className="flex w-64 flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex min-h-[13rem] flex-col justify-between gap-4">
                    <div>
                        <p className="break-words text-center text-lg mt-4 leading-snug text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {showRetry ? (
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => executeCallback(reference)}
                            >
                                Спробувати ще
                            </Button>
                        ) : (
                            <Button 
                                variant="secondary" 
                                className="w-full border border-border bg-secondary/20 hover:bg-secondary"
                                onClick={() => window.location.href = '/'}
                                disabled={isLoading}
                            >
                                На головну
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPageComponent;