import { FC, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  href: string;
  className?: string;
}

const LINK_CLASSNAME = 'cursor-pointer text-primary hover:underline';

const Link: FC<PropsWithChildren<Props>> = ({ children, href, className }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(LINK_CLASSNAME, className)}
    >
      {children}
    </a>
  );
};

export default Link;
