import React, { FC, PropsWithChildren } from 'react';
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

const HEADING_CLASSES: Record<NonNullable<HeaderTitleProps['variant']>, string> = {
    h1: 'font-display scroll-m-20 text-4xl font-bold tracking-normal lg:text-5xl',
    h2: 'font-display scroll-m-20 text-2xl font-bold tracking-normal',
    h3: 'font-display scroll-m-20 text-lg font-bold tracking-normal',
    h4: 'font-display scroll-m-20 text-base font-bold tracking-normal',
    h5: 'font-display scroll-m-20 text-base font-bold tracking-normal',
};

export const HeaderTitle: FC<PropsWithChildren<HeaderTitleProps>> = ({
    className,
    children,
    href: hrefProp,
    variant = 'h3',
}) => {
    const { href, onClick, linkProps } = useHeader();
    const Component = variant;
    const heading = <Component className={HEADING_CLASSES[variant]}>{children}</Component>;

    return (
        <div className={cn('flex items-center gap-4', className)}>
            {hrefProp || href ? (
                <a
                    href={hrefProp || href || ''}
                    {...linkProps}
                    className="text-left hover:underline"
                >
                    {heading}
                </a>
            ) : onClick ? (
                <button type="button" onClick={onClick} className="text-left hover:underline">
                    {heading}
                </button>
            ) : (
                heading
            )}
        </div>
    );
};

export const HeaderNavButton: FC = () => {
    const { href, onClick, linkProps } = useHeader();

    if (!href && !onClick) return null;

    const IconArrow = <Icon icon="material-symbols:arrow-right-alt-rounded" className="text-lg" />;

    if (href) {
        return (
            <Button
                size="icon-sm"
                variant="outline"
                asChild
                className="text-muted-foreground"
            >
                <a href={href} className="flex items-center gap-2 text-muted-foreground" {...linkProps}>
                    {IconArrow}
                </a>
            </Button>
        );
    }

    return (
        <Button
            onClick={onClick}
            size="icon-sm"
            className="text-muted-foreground"
            variant="outline"
        >
            {IconArrow}
        </Button>
    );
};
