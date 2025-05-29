"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectableItem {
	id?: string;
	label: string;
	[key: string]: any;
}

interface SelectableItemListProps {
	items: SelectableItem[];
	onSelect: (selectedId: string) => void;
}

export function SelectableItemList({
	items,
	onSelect,
}: SelectableItemListProps) {
	if (!items || items.length === 0) {
		return null;
	}

	const getActualId = useCallback(
		(item: SelectableItem, index: number): string => {
			return item.id ?? `item-${index}`;
		},
		[]
	);

	const [selectedItemId, setSelectedItemId] = useState<string>(
		getActualId(items[0], 0)
	);

	useEffect(() => {
		onSelect(selectedItemId);
	}, [selectedItemId, onSelect]);

	const handleItemClick = useCallback((itemId: string) => {
		setSelectedItemId(itemId);
	}, []);

	return (
		<div className="flex flex-wrap justify-start items-start w-full gap-2">
			{items.map((item, index) => {
				const currentItemId = getActualId(item, index);

				return (
					<Button
						key={currentItemId}
						onClick={() => handleItemClick(currentItemId)}
						className={cn(
							"text-accent-foreground rounded-sm font-medium ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-xs border border-border bg-secondary/20",
							selectedItemId === currentItemId
								? "bg-accent"
								: "hover:text-muted-foreground"
						)}
					>
						{item.label}
					</Button>
				);
			})}
		</div>
	);
}
