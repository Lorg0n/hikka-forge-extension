export const EDITOR_API_MESSAGE_SOURCE = "hikka-editor-api";

export type EditorApiCommand = "get" | "set" | "insert";

export type EditorTextNode = {
	text: string;
	[key: string]: unknown;
};

export type EditorElementNode = {
	type: string;
	children: EditorNode[];
	[key: string]: unknown;
};

export type EditorNode = EditorElementNode | EditorTextNode;
export type EditorValue = EditorElementNode[];

export type EditorApiErrorCode =
	| "invalid_value"
	| "unknown_command"
	| "missing_value"
	| "editor_error"
	| "timeout"
	| "invalid_response";

interface EditorApiRequest {
	source: typeof EDITOR_API_MESSAGE_SOURCE;
	type: "request";
	requestId: string;
	editorId: string;
	command: EditorApiCommand;
	value?: EditorValue;
}

interface EditorApiResponse {
	source: typeof EDITOR_API_MESSAGE_SOURCE;
	type: "response";
	requestId: string;
	editorId: string;
	ok: boolean;
	value?: unknown;
	error?: {
		code?: unknown;
		message?: unknown;
	};
}

export interface EditorApiClient {
	get(): Promise<EditorValue>;
	set(value: EditorValue): Promise<void>;
	insert(value: EditorValue): Promise<void>;
}

export interface EditorApiOptions {
	timeout?: number;
}

export type EditorContentType =
	| "anime"
	| "manga"
	| "novel"
	| "article"
	| "collection"
	| "character"
	| "person"
	| "edit";

export const editorIds = {
	article: "article-editor",
	comment: (contentType: EditorContentType, slug: string) =>
		`comment-${contentType}-${slug}`,
	reply: (reference: string) => `comment-reply-${reference}`,
	edit: (reference: string) => `comment-edit-${reference}`,
} as const;

export class EditorApiError extends Error {
	constructor(
		public readonly code: EditorApiErrorCode | (string & {}),
		message: string,
	) {
		super(message);
		this.name = "EditorApiError";
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isDenseNonEmptyArray = (value: unknown): value is unknown[] => {
	if (!Array.isArray(value) || value.length === 0) return false;

	for (let index = 0; index < value.length; index += 1) {
		if (!(index in value)) return false;
	}

	return true;
};

const isEditorNode = (value: unknown): value is EditorNode => {
	if (!isRecord(value)) return false;
	if (typeof value.text === "string" && !("children" in value)) return true;

	return (
		typeof value.type === "string" &&
		!("text" in value) &&
		isDenseNonEmptyArray(value.children) &&
		value.children.every(isEditorNode)
	);
};

export const isEditorValue = (value: unknown): value is EditorValue =>
	isDenseNonEmptyArray(value) &&
	value.every(
		(node) =>
			isRecord(node) && typeof node.type === "string" && isEditorNode(node),
	);

const isMatchingResponse = (
	value: unknown,
	requestId: string,
	editorId: string,
): value is EditorApiResponse =>
	isRecord(value) &&
	value.source === EDITOR_API_MESSAGE_SOURCE &&
	value.type === "response" &&
	value.requestId === requestId &&
	value.editorId === editorId &&
	typeof value.ok === "boolean";

function responseError(response: EditorApiResponse): EditorApiError {
	const code =
		typeof response.error?.code === "string"
			? response.error.code
			: "invalid_response";
	const message =
		typeof response.error?.message === "string"
			? response.error.message
			: "The editor returned an invalid error response.";

	return new EditorApiError(code, message);
}

export function editorApi(
	editorId: string,
	options: EditorApiOptions = {},
): EditorApiClient {
	const timeout = options.timeout ?? 1000;

	const send = <T extends EditorApiCommand>(
		command: T,
		value?: EditorValue,
	): Promise<T extends "get" ? EditorValue : void> =>
		new Promise((resolve, reject) => {
			const requestId = crypto.randomUUID();

			const cleanup = () => {
				window.clearTimeout(timer);
				window.removeEventListener("message", onMessage);
			};

			const onMessage = (event: MessageEvent<unknown>) => {
				if (event.source !== window) return;
				if (!isMatchingResponse(event.data, requestId, editorId)) return;

				cleanup();
				if (!event.data.ok) {
					reject(responseError(event.data));
					return;
				}

				if (command === "get") {
					if (!isEditorValue(event.data.value)) {
						reject(
							new EditorApiError(
								"invalid_response",
								"The editor returned an invalid document.",
							),
						);
						return;
					}
					resolve(event.data.value as T extends "get" ? EditorValue : void);
					return;
				}

				resolve(undefined as T extends "get" ? EditorValue : void);
			};

			const timer = window.setTimeout(() => {
				cleanup();
				reject(
					new EditorApiError(
						"timeout",
						`No editor answered "${editorId}" within ${timeout}ms.`,
					),
				);
			}, timeout);

			window.addEventListener("message", onMessage);
			const request: EditorApiRequest = {
				source: EDITOR_API_MESSAGE_SOURCE,
				type: "request",
				requestId,
				editorId,
				command,
				...(value === undefined ? {} : { value }),
			};
			window.postMessage(request, window.location.origin);
		});

	return {
		get: () => send("get"),
		set: (value) => send("set", value),
		insert: (value) => send("insert", value),
	};
}
