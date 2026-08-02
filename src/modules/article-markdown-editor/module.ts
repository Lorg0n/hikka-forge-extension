import type { ForgeModuleDef } from "@/types/module";

import ArticleMarkdownEditorComponent from "./ArticleMarkdownEditorComponent";

const articleMarkdownEditorModule: ForgeModuleDef = {
	id: "article-markdown-editor",
	name: "Markdown-редактор статей",
	description: "Додає Markdown-режим до редактора статей Hikka.",
	urlPatterns: [
		"https://hikka.io/articles/new",
		"https://hikka.io/articles/*/update",
		"https://dev.hikka.io/articles/new",
		"https://dev.hikka.io/articles/*/update",
	],
	enabledByDefault: true,
	category: "content",
	elementSelector: {
		selector: 'div.flex.flex-col.gap-4:has(> div > [data-slate-editor="true"])',
		position: "after",
		visibleOnly: true,
		hostWidth: "100%",
	},
	component: ArticleMarkdownEditorComponent,
	icon: {
		name: "lucide:code-2",
		color: "#60a5fa",
	},
};

export default articleMarkdownEditorModule;
