import React, { FC, PropsWithChildren, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

interface HorizontalCardContextProps {
    href?: string;
    onClick?: () => void;
    linkProps?: Partial<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
}

const HeaderContext = React.createContext<HorizontalCardContextProps | undefined>(undefined);

const useHeader = () => {
    const context = React.useContext(HeaderContext);
    if (!context) throw new Error('useHeader must be used within HeaderContext');
    return context;
};

interface HeaderProps {
    className?: string;
    href?: string;
    linkProps?: Partial<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    onClick?: () => void;
    id?: string;
}

export const Header: FC<PropsWithChildren<HeaderProps>> = ({
    className,
    children,
    href,
    onClick,
    linkProps,
    ...props
}) => {
    const contextValue = React.useMemo(() => ({ href, onClick, linkProps }), [href, onClick, linkProps]);

    return (
        <HeaderContext.Provider value={contextValue}>
            <div className={cn('flex items-center justify-between gap-2', className)} {...props}>
                {children}
            </div>
        </HeaderContext.Provider>
    );
};

export const HeaderContainer: FC<PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
    <div className={cn('flex flex-1 items-center gap-4', className)}>{children}</div>
);

interface HeaderTitleProps {
    className?: string;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
    href?: string;
}

export const HeaderTitle: FC<PropsWithChildren<HeaderTitleProps>> = ({ className, children, href: hrefProp }) => {
    const { href, onClick, linkProps } = useHeader();
    // Simplified typography for extension context - usually Hikka uses specific fonts
    const Component = 'h2'; 

    return (
        <div className={cn('flex items-center gap-4', className)}>
            {hrefProp || href ? (
                <a href={hrefProp || href || ''} {...linkProps} className="hover:underline text-left font-display text-xl font-bold">
                    <Component>{children}</Component>
                </a>
            ) : onClick ? (
                <button onClick={onClick} className="hover:underline text-left font-display text-xl font-bold">
                    <Component>{children}</Component>
                </button>
            ) : (
                <Component className="font-display text-xl font-bold">{children}</Component>
            )}
        </div>
    );
};

export const HeaderNavButton: FC = () => {
    const { href, onClick, linkProps } = useHeader();

    if (!href && !onClick) return null;

    const IconArrow = <Icon icon="material-symbols:arrow-right-alt-rounded" className="text-2xl" />;

    if (href) {
        return (
            <Button size="icon-sm" variant="ghost" asChild>
                <a href={href} className="flex items-center gap-2 text-muted-foreground" {...linkProps}>
                    {IconArrow}
                </a>
            </Button>
        );
    }

    return (
        <Button onClick={onClick} size="icon-sm" className="flex items-center gap-2 text-muted-foreground" variant="ghost">
            {IconArrow}
        </Button>
    );
};