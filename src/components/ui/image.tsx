'use client';

import { forwardRef, useState, type Ref, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    transitionDisabled?: boolean;
}

const Image = (
    { alt, className, transitionDisabled, ...props }: Props,
    ref: Ref<HTMLImageElement>
) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            ref={ref}
            className={cn(
                loaded ? 'opacity-100' : 'opacity-0',
                !transitionDisabled && 'transition-opacity duration-300 ease-in-out',
                className
            )}
            onLoad={() => setLoaded(true)}
            alt={alt}
            {...props}
        />
    );
};

export default forwardRef(Image);
