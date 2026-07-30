import type { ForgeModuleDef } from "@/types/module";
import ProfileReferenceCopyButton from "./ProfileReferenceCopyButton";

const profileReferenceCopyModule: ForgeModuleDef = {
	id: "profile-reference-copy",
	name: "Посилання на профіль",
	description: "Додає поруч з іменем кнопку для копіювання посилання на профіль.",
	urlPatterns: ["https://hikka.io/u/*", "https://dev.hikka.io/u/*"],
	enabledByDefault: true,
	category: "other",
	elementSelector: {
		// The name link has min-w-0; the avatar link does not. Inserting after it
		// keeps the action beside the username instead of inside the link.
		selector: 'a.min-w-0[href^="/u/"]',
		position: "after",
		hostWidth: "auto",
	},
	component: ProfileReferenceCopyButton,
	icon: {
		name: "lucide:share",
		color: "#60a5fa",
	},
};

export default profileReferenceCopyModule;
