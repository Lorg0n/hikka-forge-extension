import { Icon } from '@iconify/react';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';

interface IconLinkButtonProps {
    href: string;
    icon: string;
    label: string;
    newTab?: boolean;
}

export const IconLinkButton: FC<IconLinkButtonProps> = ({ href, icon, label, newTab = false }) => (
    <Button size="icon-sm" variant="outline" asChild className="text-muted-foreground">
        <a
            href={href}
            aria-label={label}
            title={label}
            {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
            <Icon icon={icon} className="text-lg" />
        </a>
    </Button>
);
