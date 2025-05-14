import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
    children: ReactNode | string;
    className?: string;
}

export default function Li({ children, className }: Props) {
    return <li className={cn('ps-2', className)}>{children}</li>;
}