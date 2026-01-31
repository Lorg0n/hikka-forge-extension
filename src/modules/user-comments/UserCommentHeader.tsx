import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

export const UserCommentHeader = () => {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-4">
                    <a className="hover:underline text-left text-foreground" href="#comments">
                        <h3 className="scroll-m-20 font-display text-lg font-bold tracking-normal">
                            Коментарі
                        </h3>
                    </a>

                    <img src={logo} alt="Logo" className="size-5" />
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                asChild
            >
                <a href="#comments" aria-label="View all user's comments">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="text-lg">
                        <path fill="currentColor" d="M16.15 13H5q-.425 0-.712-.288T4 12t.288-.712T5 11h11.15L13.3 8.15q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L19.3 11.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.575 4.575q-.3.3-.712.288t-.713-.313q-.275-.3-.288-.7t.288-.7z"></path>
                    </svg>
                </a>
            </Button>
        </div>
    );
};