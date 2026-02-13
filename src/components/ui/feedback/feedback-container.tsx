import React, { useState } from 'react';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { FeedbackContextMenu } from './feedback-context-menu';
import { cn } from '@/lib/utils';

interface FeedbackContainerProps {
    children: React.ReactNode;
    /** 
     * The async function that performs the feedback submission.
     * Should return true if successful.
     */
    onSubmit: (isPositive: boolean) => Promise<boolean>;
    /** Optional callback after animation is complete */
    onRemove?: () => void;
    className?: string;
}

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({ 
    children, 
    onSubmit, 
    onRemove,
    className 
}) => {
    const { isAuthenticated } = useAuth();
    const [isHidden, setIsHidden] = useState(false);

    // If not authenticated, simply render the card without context menu logic
    if (!isAuthenticated) {
        return <div className={className}>{children}</div>;
    }

    const handleFeedbackWrapper = async (isPositive: boolean) => {
        const success = await onSubmit(isPositive);

        if (success && !isPositive) {
            // Trigger hide animation on negative feedback
            setIsHidden(true);
            
            // Allow animation to play before potentially unmounting or refetching
            setTimeout(() => {
                onRemove?.();
            }, 300);
        }
    };

    if (isHidden) {
        return null; // Or return a placeholder if layout shift is a concern
    }

    return (
        <FeedbackContextMenu onFeedback={handleFeedbackWrapper} className={className}>
            <div className={cn(
                "transition-all duration-300 ease-in-out",
                isHidden && "opacity-0 scale-95 grayscale"
            )}>
                {children}
            </div>
        </FeedbackContextMenu>
    );
};