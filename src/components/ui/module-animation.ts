export const MODULE_ANIMATION_DURATION_MS = 280;

const MODULE_ANIMATION_EASE = [0.22, 1, 0.36, 1] as const;

export function getModuleAnimationTransition(reducedMotion: boolean) {
	return reducedMotion
		? { duration: 0 }
		: {
				duration: MODULE_ANIMATION_DURATION_MS / 1000,
				ease: MODULE_ANIMATION_EASE,
		  };
}

export function getModuleEnterInitial(reducedMotion: boolean) {
	return { opacity: 0, y: reducedMotion ? 0 : 10 };
}

export function getModuleExitAnimation(reducedMotion: boolean) {
	return { opacity: 0, y: reducedMotion ? 0 : -8 };
}
