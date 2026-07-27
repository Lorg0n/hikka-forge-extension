'use client';

import { withProps } from '@udecode/cn';
import Markdown, { type Components, type Options } from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';

import Blockquote from '@/components/typography/blockquote';
import Li from '@/components/typography/li';
import Link from '@/components/typography/link';
import Ol from '@/components/typography/ol';
import P from '@/components/typography/p';
import Spoiler from '@/components/typography/spoiler';
import Ul from '@/components/typography/ul';

import { cn } from '@/lib/utils';

import NoSpoiler from './components/no-spoiler';
import remarkDisableTokenizer from './plugins/remark-disable-tokenizer';
import remarkSoftBreaks from './plugins/remark-soft-breaks';

type ExtendedComponents = Components & Record<string, unknown>;

interface Props extends Omit<Options, 'components'> {
    preview?: boolean;
    className?: string;
    preserveLineBreaks?: boolean;
    components?: ExtendedComponents;
}

type CustomComponents = Components & {
    spoiler: React.ComponentType<{
        children?: React.ReactNode;
        className?: string;
    }>;
};

const previewComponents: CustomComponents = {
    spoiler: NoSpoiler,
    a: ({ children, className }) => (
        <span
            className={cn('text-primary-foreground hover:underline', className)}
        >
            {children}
        </span>
    ),
    p: P,
};

const components = (preview?: boolean): CustomComponents =>
    ({
        spoiler: withProps(Spoiler, { className: 'mb-4' }),
        p: withProps(P, { className: 'mb-4' }),
        blockquote: withProps(Blockquote, { className: 'mb-4' }),
        a: withProps(Link, { className: 'text-primary-foreground' }),
        ul: withProps(Ul, { className: 'mb-4' }),
        ol: withProps(Ol, { className: 'mb-4' }),
        li: Li,
        ...(preview ? previewComponents : {}),
    }) as CustomComponents;

const MDViewer = ({
    children,
    className,
    preview,
    preserveLineBreaks = false,
    components: customComponents,
    ...props
}: Props) => {
    return (
        <div className={className}>
            <Markdown
                remarkPlugins={[
                    remarkDisableTokenizer,
                    remarkDirective,
                    remarkDirectiveRehype,
                    ...(preserveLineBreaks ? [remarkSoftBreaks] : []),
                ]}
                components={
                    { ...components(preview), ...customComponents } as Components
                }
                {...props}
            >
                {children}
            </Markdown>
        </div>
    );
};

export default MDViewer;
