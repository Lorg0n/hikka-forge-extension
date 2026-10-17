import type { ForgeModuleDef } from "@/types/module";

import CommentGifComponent from "./CommentGifComponent";

const commentGifModule: ForgeModuleDef = {
	id: "hikka-stickers",
	name: "Стікери Hikka",
	description:
		"Додає до коментарів стікери, GIF-емодзі та інші реакції у стилі 7TV.",
	urlPatterns: [
		"https://hikka.io/*",
		"https://dev.hikka.io/*",
	],
	enabledByDefault: true,
	category: "other",
	elementSelector: {
		selector:
			'#comments [role="toolbar"][aria-orientation="horizontal"] > div:first-child',
		position: "append",
		hostWidth: "auto",
		visibleOnly: true,
	},
	component: CommentGifComponent,
	icon: {
		name: "lucide:sticker",
		color: "#f59e0b",
	},
};

export default commentGifModule;
