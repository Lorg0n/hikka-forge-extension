import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { Icon } from "@iconify/react";

export const UserRecommendationsHeader = () => {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-4">
                    <a className="hover:underline text-left text-foreground" href="#recommendations">
                        <h3 className="scroll-m-20 font-display text-lg font-bold tracking-normal">
                            Персональні рекомендації
                        </h3>
                    </a>
                    
                    {/* Optional: Add a small icon or badge */}
                    <img src={logo} alt="Hikka Forge Logo" className="size-5 opacity-80" />
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                asChild
            >
                <a href="#recommendations" aria-label="View recommendations">
                    <Icon icon="material-symbols:recommend-rounded" className="text-xl" />
                </a>
            </Button>
        </div>
    );
};