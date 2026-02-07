import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogin: (token: string) => Promise<boolean>;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange, onLogin }) => {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token.trim()) {
            setError('Будь ласка, введіть токен');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const success = await onLogin(token.trim());
            
            if (success) {
                setToken('');
                onOpenChange(false);
            } else {
                setError('Невірний токен. Перевірте і спробуйте знову.');
            }
        } catch (err) {
            setError('Помилка авторизації. Спробуйте пізніше.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            setToken('');
            setError(null);
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Увійти в Hikka Forge</DialogTitle>
                    <DialogDescription>
                        Введіть ваш токен для доступу до розширених функцій
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">Токен авторизації</Label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="Введіть ваш токен..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            Скасувати
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Перевірка...' : 'Увійти'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};