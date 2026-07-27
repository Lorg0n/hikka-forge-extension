import { HIKKA_API_BASE } from '@/constants';
import { AuthService } from './authService';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_IMAGE_SIZE = 200;
const MAX_IMAGE_SIZE = 2000;
const PASSTHROUGH_TYPES = new Set(['image/jpeg', 'image/webp', 'image/gif']);

export class ArticleImageUploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ArticleImageUploadError';
	}
}

function getImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve({ width: image.naturalWidth, height: image.naturalHeight });
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new ArticleImageUploadError('Не вдалося обробити зображення.'));
		};
		image.src = objectUrl;
	});
}

async function convertToJpeg(file: File): Promise<File> {
	const { width, height } = await getImageDimensions(file);
	const objectUrl = URL.createObjectURL(file);

	try {
		const image = new Image();
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new ArticleImageUploadError('Не вдалося обробити зображення.'));
			image.src = objectUrl;
		});

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		if (!context) throw new ArticleImageUploadError('Не вдалося обробити зображення.');

		// JPEG has no alpha channel. A white background matches the behavior of
		// the Hikka frontend converter for transparent screenshots.
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', 0.9),
		);
		if (!blob) throw new ArticleImageUploadError('Не вдалося обробити зображення.');

		const filename = file.name.replace(/\.[^.]+$/, '') || 'image';
		return new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}

async function prepareImage(file: File): Promise<File> {
	if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
		throw new ArticleImageUploadError('Непідтримуваний формат зображення.');
	}

	const dimensions = await getImageDimensions(file);
	if (
		dimensions.width < MIN_IMAGE_SIZE ||
		dimensions.height < MIN_IMAGE_SIZE ||
		dimensions.width > MAX_IMAGE_SIZE ||
		dimensions.height > MAX_IMAGE_SIZE
	) {
		throw new ArticleImageUploadError(
			`Розмір зображення має бути від ${MIN_IMAGE_SIZE} до ${MAX_IMAGE_SIZE} пікселів.`,
		);
	}

	const prepared = PASSTHROUGH_TYPES.has(file.type) ? file : await convertToJpeg(file);
	if (prepared.size > MAX_FILE_SIZE) {
		throw new ArticleImageUploadError('Зображення завелике (максимум 2 МБ).');
	}
	return prepared;
}

async function getErrorMessage(response: Response): Promise<string> {
	try {
		const data = (await response.json()) as { message?: unknown };
		if (typeof data.message === 'string' && data.message) return data.message;
	} catch {
		// Fall through to the status-based message.
	}
	return `Не вдалося завантажити зображення (${response.status}).`;
}

export async function uploadArticleImage(file: File): Promise<{ url: string }> {
	const prepared = await prepareImage(file);
	const createBody = () => {
		const body = new FormData();
		body.append('file', prepared, prepared.name);
		return body;
	};

	// Hikka keeps the browser session in its HttpOnly `auth` cookie. The
	// browser sends it to api.hikka.io when credentials are included.
	let response = await fetch(`${HIKKA_API_BASE}/upload/attachment`, {
		method: 'PUT',
		credentials: 'include',
		body: createBody(),
	});

	// The extension may also have a Hikka token from its OAuth flow. Use it only
	// as a fallback; never send uploads to the Forge API.
	if (response.status === 401 || response.status === 403) {
		const token = await AuthService.getToken();
		if (token) {
			response = await fetch(`${HIKKA_API_BASE}/upload/attachment`, {
				method: 'PUT',
				credentials: 'include',
				headers: { auth: token },
				body: createBody(),
			});
		}
	}

	if (!response.ok) {
		throw new ArticleImageUploadError(await getErrorMessage(response));
	}

	const data = (await response.json()) as { url?: unknown };
	if (typeof data.url !== 'string' || !data.url) {
		throw new ArticleImageUploadError('Сервер не повернув адресу зображення.');
	}

	return { url: data.url };
}
