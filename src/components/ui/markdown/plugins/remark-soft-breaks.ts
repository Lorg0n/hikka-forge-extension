interface MarkdownNode {
	type: string;
	value?: string;
	children?: MarkdownNode[];
}

function preserveLineBreaks(nodes: MarkdownNode[]): MarkdownNode[] {
	const result: MarkdownNode[] = [];

	for (const node of nodes) {
		if (node.type === "text" && node.value?.includes("\n")) {
			const parts = node.value.split("\n");
			parts.forEach((part, index) => {
				if (part) result.push({ type: "text", value: part });
				if (index < parts.length - 1) result.push({ type: "break" });
			});
			continue;
		}

		if (node.children) {
			result.push({ ...node, children: preserveLineBreaks(node.children) });
		} else {
			result.push(node);
		}
	}

	return result;
}

export default function remarkSoftBreaks() {
	return (tree: MarkdownNode) => {
		const visit = (node: MarkdownNode) => {
			if (!node.children) return;
			node.children = preserveLineBreaks(node.children);
		};

		const walk = (node: MarkdownNode) => {
			visit(node);
			node.children?.forEach(walk);
		};

		walk(tree);
	};
}
