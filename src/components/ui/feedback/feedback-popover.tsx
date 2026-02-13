import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface FeedbackContextMenuProps {
    onFeedback: (isPositive: boolean) => Promise<void>;
    children: React.ReactNode;
    disabled?: boolean;
}

export const FeedbackContextMenu: React.FC<FeedbackContextMenuProps> = ({
    onFeedback,
    children,
    disabled = false,
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

        // Calculate position
        const x = e.clientX;
        const y = e.clientY;

        setPosition({ x, y });
        setOpen(true);
        setSubmitted(false);
    };

    const handleFeedback = async (isPositive: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await onFeedback(isPositive);
            setSubmitted(true);
            setTimeout(() => {
                setOpen(false);
                setTimeout(() => setSubmitted(false), 300);
            }, 1500);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            setLoading(false);
        }
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    // Adjust position if menu would go off screen
    useEffect(() => {
        if (open && menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newX = position.x;
            let newY = position.y;

            // Adjust horizontal position
            if (rect.right > viewportWidth) {
                newX = viewportWidth - rect.width - 8;
            }

            // Adjust vertical position
            if (rect.bottom > viewportHeight) {
                newY = viewportHeight - rect.height - 8;
            }

            if (newX !== position.x || newY !== position.y) {
                setPosition({ x: newX, y: newY });
            }
        }
    }, [open, position]);

    return (
        <div onContextMenu={handleContextMenu} className="relative">
            {children}

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-50" />

                    {/* Context Menu */}
                    <div
                        ref={menuRef}
                        className={cn(
                            "fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-3 animate-in fade-in-0 zoom-in-95",
                            "min-w-[200px]"
                        )}
                        style={{
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                        }}
                    >
                        {submitted ? (
                            <div className="flex items-center gap-2 text-sm text-success-foreground py-1">
                                <Icon icon="material-symbols:check-circle-rounded" className="size-5" />
                                <span>Дякуємо за відгук!</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                                    Оцініть рекомендацію
                                </p>
                                <button
                                    onClick={(e) => handleFeedback(true, e)}
                                    disabled={loading}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                                        "hover:bg-accent hover:text-accent-foreground transition-colors",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "text-left"
                                    )}
                                >
                                    <Icon icon="material-symbols:thumb-up-rounded" className="size-4" />
                                    <span>Подобається</span>
                                </button>
                                <button
                                    onClick={(e) => handleFeedback(false, e)}
                                    disabled={loading}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                                        "hover:bg-accent hover:text-accent-foreground transition-colors",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "text-left"
                                    )}
                                >
                                    <Icon icon="material-symbols:thumb-down-rounded" className="size-4" />
                                    <span>Не цікаво</span>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};