import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface FeedbackContextMenuProps {
    onFeedback: (isPositive: boolean) => Promise<void>;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export const FeedbackContextMenu: React.FC<FeedbackContextMenuProps> = ({
    onFeedback,
    children,
    disabled = false,
    className
}) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        if (disabled) return;
        
        e.preventDefault();
        e.stopPropagation();

        setPosition({ x: e.clientX, y: e.clientY });
        setOpen(true);
        setSubmitted(false);
    };

    const handleFeedbackAction = async (isPositive: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await onFeedback(isPositive);
            setSubmitted(true);
            setTimeout(() => {
                setOpen(false);
                setTimeout(() => setSubmitted(false), 300);
            }, 1000); // Shorter timeout for better UX
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    // Click outside & Escape listeners
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    // Viewport adjustment
    useEffect(() => {
        if (open && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;

            let newX = position.x;
            let newY = position.y;

            if (rect.right > viewportW) newX = viewportW - rect.width - 8;
            if (rect.bottom > viewportH) newY = viewportH - rect.height - 8;

            if (newX !== position.x || newY !== position.y) {
                setPosition({ x: newX, y: newY });
            }
        }
    }, [open, position]);

    return (
        <div onContextMenu={handleContextMenu} className={cn("relative h-full", className)}>
            {children}

            {open && (
                <>
                    <div className="fixed inset-0 z-50" />
                    <div
                        ref={menuRef}
                        className={cn(
                            "fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95",
                            "min-w-[160px] flex flex-col gap-1"
                        )}
                        style={{ left: position.x, top: position.y }}
                    >
                        {submitted ? (
                            <div className="flex items-center gap-2 text-sm text-success-foreground px-3 py-2">
                                <Icon icon="material-symbols:check-circle-rounded" className="size-5" />
                                <span>Відгук прийнято</span>
                            </div>
                        ) : (
                            <>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 select-none">
                                    Оцінити
                                </p>
                                <FeedbackButton 
                                    icon="material-symbols:thumb-up-rounded" 
                                    label="Подобається" 
                                    onClick={(e) => handleFeedbackAction(true, e)}
                                    disabled={loading}
                                />
                                <FeedbackButton 
                                    icon="material-symbols:thumb-down-rounded" 
                                    label="Не цікаво" 
                                    onClick={(e) => handleFeedbackAction(false, e)}
                                    disabled={loading}
                                />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const FeedbackButton = ({ icon, label, onClick, disabled }: { icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled: boolean }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-left transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
    >
        <Icon icon={icon} className="size-4" />
        <span>{label}</span>
    </button>
);