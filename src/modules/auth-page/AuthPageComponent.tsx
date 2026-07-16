import React, { useCallback, useEffect, useRef } from 'react';
import { useHikkaCallback } from '@/hooks/useHikkaCallback';
import { AuthService } from '@/services/authService';

type ButtonVariant = 'primary' | 'secondary';

interface PageButtonOptions {
    text: string;
    variant?: ButtonVariant;
    id?: string;
    onClick: () => void;
}

const postToPage = (data: Record<string, unknown>): void => {
    window.postMessage({ source: 'hikka_forge_extension', ...data }, '*');
};

const AuthPageComponent: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    const redirect = params.get('redirect') || '/';

    const { executeCallback, data, loading, error } = useHikkaCallback();

    const actionsElRef = useRef<HTMLElement | null>(null);
    const buttonsRef = useRef<HTMLButtonElement[]>([]);

    const getActionsEl = useCallback((): HTMLElement | null => {
        if (!actionsElRef.current) {
            actionsElRef.current = document.getElementById('actions');
        }
        return actionsElRef.current;
    }, []);

    const clearButtons = useCallback(() => {
        buttonsRef.current.forEach((b) => b.remove());
        buttonsRef.current = [];
    }, []);

    const addButton = useCallback((opts: PageButtonOptions) => {
        const container = getActionsEl();
        if (!container) return;
        const el = document.createElement('button');
        el.className = 'btn btn-' + (opts.variant ?? 'secondary');
        el.textContent = opts.text;
        if (opts.id) el.id = opts.id;
        el.addEventListener('click', opts.onClick);
        container.appendChild(el);
        buttonsRef.current.push(el);
    }, [getActionsEl]);

    const setStatus = useCallback((text: string) => {
        postToPage({ status: text });
    }, []);

    const showActions = useCallback(() => {
        postToPage({ showActions: true });
    }, []);

    const goHome = useCallback(() => {
        window.location.href = redirect.startsWith('http')
            ? redirect
            : `https://hikka.io${redirect}`;
    }, [redirect]);

    useEffect(() => {
        if (reference) {
            setStatus('Перевірка авторизації...');
            void executeCallback(reference);
        }
    }, [reference, executeCallback, setStatus]);

    useEffect(() => {
        if (loading) {
            setStatus('Перевірка авторизації...');
            return;
        }
        if (error) {
            setStatus(error);
            clearButtons();
            addButton({ text: 'Спробувати ще', variant: 'primary', id: 'retry', onClick: () => reference && void executeCallback(reference) });
            addButton({ text: 'На головну', variant: 'secondary', id: 'home', onClick: goHome });
            showActions();
            return;
        }
        if (data?.secret) {
            setStatus('Створення сесії...');
            void (async () => {
                await AuthService.setToken(data.secret);
                const user = await AuthService.getCurrentUser();
                if (user) {
                    setStatus('Вхід виконано. Перенаправлення...');
                    setTimeout(() => goHome(), 800);
                } else {
                    await AuthService.removeToken();
                    setStatus('Не вдалося отримати профіль');
                    clearButtons();
                    addButton({ text: 'Спробувати ще', variant: 'primary', id: 'retry', onClick: () => reference && void executeCallback(reference) });
                    addButton({ text: 'На головну', variant: 'secondary', id: 'home', onClick: goHome });
                    showActions();
                }
            })();
            return;
        }
        if (!reference) {
            setStatus('Відсутній код авторизації');
            clearButtons();
            addButton({ text: 'На головну', variant: 'secondary', id: 'home', onClick: goHome });
            showActions();
        }
    }, [data, loading, error, reference, redirect, executeCallback, setStatus, clearButtons, addButton, showActions, goHome]);

    return null;
};

export default AuthPageComponent;