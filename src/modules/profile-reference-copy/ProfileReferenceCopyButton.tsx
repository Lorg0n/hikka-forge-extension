import { Icon } from "@iconify/react";
import { useState } from "react";
import { HIKKA_BASE } from "@/constants";
import { fetchUserProfileReference } from "@/services/userService";

function copyFallback(value: string): boolean {
	const textarea = document.createElement("textarea");
	textarea.value = value;
	textarea.setAttribute("readonly", "");
	textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
	document.body.appendChild(textarea);
	textarea.select();
	const copied = document.execCommand("copy");
	textarea.remove();
	return copied;
}

async function copyToClipboard(value: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(value);
	} catch {
		if (!copyFallback(value)) throw new Error("Clipboard access is unavailable");
	}
}

export default function ProfileReferenceCopyButton() {
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
	const [loading, setLoading] = useState(false);

	const copyProfileLink = async () => {
		const username = decodeURIComponent(window.location.pathname.split("/")[2] ?? "");
		if (!username) return;

		setLoading(true);
		setStatus("idle");
		try {
			const reference = await fetchUserProfileReference(username);
			await copyToClipboard(`${HIKKA_BASE}/u/${reference}`);
			setStatus("copied");
			window.setTimeout(() => setStatus("idle"), 1600);
		} catch {
			setStatus("error");
			window.setTimeout(() => setStatus("idle"), 2400);
		} finally {
			setLoading(false);
		}
	};

	const label =
		status === "copied"
			? "Profile link copied"
			: status === "error"
				? "Could not copy profile link"
				: "Copy profile link";

	return (
		<div>
			<button
				type="button"
				onClick={copyProfileLink}
				disabled={loading}
				aria-label={label}
				title={label}
				className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-all hover:bg-secondary/80 disabled:cursor-wait disabled:opacity-70"
			>
				<Icon
					icon={status === "copied" ? "lucide:check" : "lucide:share"}
					className="size-4"
				/>
			</button>
		</div>
	);
}
