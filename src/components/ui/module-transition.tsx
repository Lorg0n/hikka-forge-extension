import { Children, isValidElement, type PropsWithChildren, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface ModuleTransitionProps extends PropsWithChildren {
	stateKey: string;
	className?: string;
	children: ReactNode;
}

export function ModuleTransition({
	stateKey,
	className,
	children,
}: ModuleTransitionProps) {
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence initial={false} mode="wait">
			<motion.div
				key={stateKey}
				initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
				transition={
					reducedMotion
						? { duration: 0 }
						: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }
				}
				className={className}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}

interface ModuleListTransitionProps extends PropsWithChildren {
	className?: string;
	children: ReactNode;
}

export function ModuleListTransition({
	className,
	children,
}: ModuleListTransitionProps) {
	const reducedMotion = useReducedMotion();

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: {
					transition: {
						staggerChildren: reducedMotion ? 0 : 0.035,
					},
				},
			}}
			className={className}
		>
			{Children.map(children, (child, index) => (
				<motion.div
					key={isValidElement(child) && child.key != null ? child.key : index}
					variants={{
						hidden: { opacity: 0, y: reducedMotion ? 0 : 5 },
						visible: { opacity: 1, y: 0 },
					}}
					transition={reducedMotion ? { duration: 0 } : { duration: 0.18 }}
				>
					{child}
				</motion.div>
			))}
		</motion.div>
	);
}
