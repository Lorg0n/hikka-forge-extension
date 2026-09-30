import { readFile } from "node:fs/promises";

const REQUIRED_ENVIRONMENT_VARIABLES = [
	"CLIENT_ID",
	"CLIENT_SECRET",
	"REFRESH_TOKEN",
	"PUBLISHER_ID",
	"EXTENSION_ID",
];
const MAX_UPLOAD_STATUS_CHECKS = 60;
const UPLOAD_STATUS_CHECK_DELAY_MS = 5_000;

function getRequiredEnvironmentVariable(name) {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}

async function readJsonResponse(response, operation) {
	const responseText = await response.text();
	if (!response.ok) {
		throw new Error(`${operation} failed (${response.status} ${response.statusText}): ${responseText}`);
	}

	try {
		return JSON.parse(responseText);
	} catch {
		throw new Error(`${operation} returned invalid JSON: ${responseText}`);
	}
}

function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

for (const name of REQUIRED_ENVIRONMENT_VARIABLES) getRequiredEnvironmentVariable(name);

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/publish-chrome-web-store-v2.mjs <package.zip>");

const clientId = getRequiredEnvironmentVariable("CLIENT_ID");
const clientSecret = getRequiredEnvironmentVariable("CLIENT_SECRET");
const refreshToken = getRequiredEnvironmentVariable("REFRESH_TOKEN");
const publisherId = getRequiredEnvironmentVariable("PUBLISHER_ID");
const extensionId = getRequiredEnvironmentVariable("EXTENSION_ID");
const itemName = `publishers/${encodeURIComponent(publisherId)}/items/${encodeURIComponent(extensionId)}`;

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
	method: "POST",
	headers: { "Content-Type": "application/x-www-form-urlencoded" },
	body: new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: "refresh_token",
		refresh_token: refreshToken,
	}),
});
const token = await readJsonResponse(tokenResponse, "OAuth token refresh");
if (typeof token.access_token !== "string" || token.access_token.length === 0) {
	throw new Error("OAuth token refresh did not return an access token");
}

const packageBytes = await readFile(source);
const authorization = { Authorization: `Bearer ${token.access_token}` };
const uploadResponse = await fetch(
	`https://chromewebstore.googleapis.com/upload/v2/${itemName}:upload`,
	{
		method: "POST",
		headers: { ...authorization, "Content-Type": "application/zip" },
		body: packageBytes,
	},
);
let upload = await readJsonResponse(uploadResponse, "Chrome Web Store package upload");
console.log(`Chrome Web Store upload state: ${upload.uploadState ?? "unknown"}`);

for (
	let attempt = 0;
	upload.uploadState === "IN_PROGRESS" && attempt < MAX_UPLOAD_STATUS_CHECKS;
	attempt += 1
) {
	await wait(UPLOAD_STATUS_CHECK_DELAY_MS);
	const statusResponse = await fetch(
		`https://chromewebstore.googleapis.com/v2/${itemName}:fetchStatus`,
		{ headers: authorization },
	);
	const status = await readJsonResponse(statusResponse, "Chrome Web Store upload status check");
	upload = { ...upload, uploadState: status.lastAsyncUploadState };
	console.log(`Chrome Web Store upload state: ${upload.uploadState ?? "unknown"}`);
}

if (upload.uploadState !== "SUCCEEDED") {
	throw new Error(`Chrome Web Store upload did not succeed: ${upload.uploadState ?? "unknown state"}`);
}

const publishResponse = await fetch(
	`https://chromewebstore.googleapis.com/v2/${itemName}:publish`,
	{
		method: "POST",
		headers: { ...authorization, "Content-Type": "application/json" },
		body: JSON.stringify({ publishType: "DEFAULT_PUBLISH" }),
	},
);
const publish = await readJsonResponse(publishResponse, "Chrome Web Store publish");
console.log(`Chrome Web Store submission state: ${publish.state ?? "unknown"}`);
