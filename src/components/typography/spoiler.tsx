import { Eye } from "lucide-react";
import { type FC, type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CLAMP_PX = 88;

const SpoilerPill = () => (
	<span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
		<Eye className="size-3.5" aria-hidden="true" />
		Спойлер
	</span>
);

interface Props {
	children: ReactNode;
	className?: string;
}

const Spoiler: FC<Props> = ({ children, className }) => {
	const [revealed, setRevealed] = useState(false);
	const hidden = !revealed;

	return (
		<div
			className={cn(
				"spoiler relative isolate w-full rounded-xl border border-border bg-secondary/20 p-2",
				className,
			)}
		>
			<div
				className={cn(
					"overflow-hidden",
					hidden && "pointer-events-none select-none blur-sm",
				)}
				style={{ maxHeight: hidden ? CLAMP_PX : undefined }}
			>
				<div aria-hidden={hidden}>{children}</div>
			</div>

			{hidden ? (
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						setRevealed(true);
					}}
					aria-label="Показати спойлер"
					className="absolute inset-0 z-20 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<SpoilerPill />
				</button>
			) : (
				<div className="relative z-20 flex w-full items-center justify-start pt-2">
					<Button
						variant="link"
						size="sm"
						className="h-auto p-0 text-sm font-medium text-muted-foreground hover:text-foreground"
						onClick={(event) => {
							event.stopPropagation();
							setRevealed(false);
						}}
					>
						Приховати спойлер
					</Button>
				</div>
			)}
		</div>
	);
};

export default Spoiler;
