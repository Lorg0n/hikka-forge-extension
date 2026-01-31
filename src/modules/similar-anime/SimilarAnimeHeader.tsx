import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import Link from '@/components/typography/link';

export const SimilarAnimeHeader = () => {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-4">
                    <a href="#similar">
                        <h3 className="scroll-m-20 font-display text-lg font-bold tracking-normal">
                            Може бути схожим
                        </h3>
                    </a>
                    
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-muted-foreground transition-colors hover:text-foreground flex items-center justify-center outline-none">
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
                                        className="text-muted-foreground underline hover:muted-foreground/80"
                                    >
                                        Більш детально механізм розписаний в серії статей
                                    </Link>
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                asChild
            >
                <a href="#similar" aria-label="View all similar anime">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="text-lg">
                        <path fill="currentColor" d="M16.15 13H5q-.425 0-.712-.288T4 12t.288-.712T5 11h11.15L13.3 8.15q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L19.3 11.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.575 4.575q-.3.3-.712.288t-.713-.313q-.275-.3-.288-.7t.288-.7z"></path>
                    </svg>
                </a>
            </Button>
        </div>
    );
};