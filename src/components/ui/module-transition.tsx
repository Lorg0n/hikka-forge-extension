import { logger } from "@/utils/logger";
import { Children, isValidElement, useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	getModuleAnimationTransition,
	getModuleEnterInitial,
	getModuleExitAnimation,
} from "@/components/ui/module-animation";

interface ModuleTransitionProps extends PropsWithChildren {
	stateKey: string;
	/** Keep the mounted wrapper stable when loading/content changes. */
	animateStateChanges?: boolean;
	className?: string;
	children: ReactNode;
}

export function ModuleTransition({
	stateKey,
	animateStateChanges = true,
	className,
	children,
}: ModuleTransitionProps) {
	const reducedMotion = useReducedMotion();
	const transitionKey = animateStateChanges ? stateKey : "module";
	const motionTransition = getModuleAnimationTransition(Boolean(reducedMotion));

	useEffect(() => {
		logger.log("[Hikka Forge][debug] ModuleTransition state", {
			stateKey,
			transitionKey,
			animateStateChanges,
		});
	}, [stateKey, transitionKey, animateStateChanges]);

	return (
		<AnimatePresence initial={false} mode="wait">
			<motion.div
				key={transitionKey}
				initial={getModuleEnterInitial(Boolean(reducedMotion))}
				animate={{ opacity: 1, y: 0 }}
				exit={getModuleExitAnimation(Boolean(reducedMotion))}
				transition={motionTransition}
				className={className}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}

interface ModuleListTransitionProps extends PropsWithChildren {
	className?: string;
	/** Disable the list stagger when the parent module already has an enter animation. */
	animateOnMount?: boolean;
	children: ReactNode;
}

export function ModuleListTransition({
	className,
	animateOnMount = true,
	children,
}: ModuleListTransitionProps) {
	const reducedMotion = useReducedMotion();
	const childCount = Children.count(children);
	const childCountRef = useRef(childCount);

	useEffect(() => {
		childCountRef.current = childCount;
	}, [childCount]);

	useEffect(() => {
		logger.log("[Hikka Forge][debug] ModuleListTransition mounted", {
			childCount: childCountRef.current,
		});
		return () => {
			logger.log("[Hikka Forge][debug] ModuleListTransition unmounted", {
				childCount: childCountRef.current,
			});
		};
	}, []);

	useEffect(() => {
		logger.log("[Hikka Forge][debug] ModuleListTransition child count", { childCount });
	}, [childCount]);

	return (
		<motion.div
			initial={animateOnMount ? "hidden" : false}
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
