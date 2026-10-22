import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import logo from '@/assets/logo.svg';
import Link from '@/components/typography/link';
import { getHikkaBaseForUrl } from '@/constants';

export const SimilarContentHeader = () => {
    const hikkaBase = getHikkaBaseForUrl(window.location.href);

    return (
        <SectionHeader
            title="Може бути схожим"
            href="#similar"
            action={
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted-foreground"
                                aria-label="Інформація про рекомендації"
                            >
                                <img src={logo} alt="Logo" className="size-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="p-3"
                            style={{ maxWidth: 'min(384px, var(--radix-popper-available-width))' }}
                        >
                            <p className="mb-2 font-semibold">Згенеровано нейромережею</p>
                            <p className="text-sm text-muted-foreground">
                                Модель аналізує жанри, описи та інші метадані для пошуку схожих творів.
                                Оскільки вона ще в розробці, результати можуть бути неточними.
                            </p>
                            <p className="mt-2 text-sm">
                                <Link
                                    href={`${hikkaBase}/articles?page=1&tags=embedding&tags=forge`}
                                    className="text-muted-foreground underline hover:muted-foreground/80"
                                >
                                    Більш детально механізм розписаний в серії статей
                                </Link>
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            }
        />
    );
};
