import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logo from "@/assets/logo.svg";
import Link from '@/components/typography/link';

export const SimilarAnimeHeader = () => (
    <div className="flex items-center gap-4">
        <h3 className="font-display text-lg font-bold">Може бути схожим</h3>
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="text-muted-foreground transition-colors hover:text-foreground">
                        <img src={logo} alt="Logo" className="size-5" />
                    </button>
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
                            href="https://hikka.io/articles?page=1&tags=embedding&tags=forge"
                            className="text-primary underline hover:text-primary/80"
                        >
                            Більш детально механізм розписаний в серії статей
                        </Link>
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
);