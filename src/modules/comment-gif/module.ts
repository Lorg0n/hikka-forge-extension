import type { ForgeModuleDef } from "@/types/module";

import CommentGifComponent from "./CommentGifComponent";

const commentGifModule: ForgeModuleDef = {
	id: "hikka-stickers",
	name: "Стікери",
	description:
		"Додає до коментарів стікери, GIF-емодзі та інші реакції.",
	beta: true,
	urlPatterns: [
		"https://hikka.io/*",
		"https://dev.hikka.io/*",
	],
	enabledByDefault: true,
	persistent: true,
	category: "other",
	elementSelector: {
		selector: "html",
		position: "append",
		hostWidth: "auto",
		visibleOnly: false,
	},
	component: CommentGifComponent,
	icon: {
		name: "lucide:sticker",
		color: "#f59e0b",
	},
};

export default commentGifModule;
