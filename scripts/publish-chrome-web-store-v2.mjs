import { readFile } from "node:fs/promises";
import { createSign } from "node:crypto";

const REQUIRED_ENVIRONMENT_VARIABLES = [
	"SERVICE_ACCOUNT_KEY_BASE64",
	"PUBLISHER_ID",
	"EXTENSION_ID",
];
const MAX_UPLOAD_STATUS_CHECKS = 60;
const UPLOAD_STATUS_CHECK_DELAY_MS = 5_000;
const CHROME_WEB_STORE_SCOPE = "https://www.googleapis.com/auth/chromewebstore";

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

function createServiceAccountAssertion(credentials) {
	const now = Math.floor(Date.now() / 1_000);
	const encodedHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
	const encodedPayload = Buffer.from(
		JSON.stringify({
			iss: credentials.client_email,
			scope: CHROME_WEB_STORE_SCOPE,
			aud: credentials.token_uri,
			iat: now,
			exp: now + 3_600,
		}),
	).toString("base64url");
	const unsignedAssertion = `${encodedHeader}.${encodedPayload}`;
	const signer = createSign("RSA-SHA256");
	signer.update(unsignedAssertion);
	signer.end();

	return `${unsignedAssertion}.${signer.sign(credentials.private_key, "base64url")}`;
}

for (const name of REQUIRED_ENVIRONMENT_VARIABLES) getRequiredEnvironmentVariable(name);

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/publish-chrome-web-store-v2.mjs <package.zip>");

const publisherId = getRequiredEnvironmentVariable("PUBLISHER_ID");
const extensionId = getRequiredEnvironmentVariable("EXTENSION_ID");
const itemName = `publishers/${encodeURIComponent(publisherId)}/items/${encodeURIComponent(extensionId)}`;
const encodedServiceAccountKey = getRequiredEnvironmentVariable("SERVICE_ACCOUNT_KEY_BASE64");
let serviceAccountCredentials;

try {
	serviceAccountCredentials = JSON.parse(
		Buffer.from(encodedServiceAccountKey, "base64").toString("utf8"),
	);
} catch {
	throw new Error("SERVICE_ACCOUNT_KEY_BASE64 must contain a base64-encoded service account JSON key");
}

if (
	typeof serviceAccountCredentials.client_email !== "string" ||
	typeof serviceAccountCredentials.private_key !== "string" ||
	typeof serviceAccountCredentials.token_uri !== "string"
) {
	throw new Error("SERVICE_ACCOUNT_KEY_BASE64 is missing required service account credentials");
}

const tokenResponse = await fetch(serviceAccountCredentials.token_uri, {
	method: "POST",
	headers: { "Content-Type": "application/x-www-form-urlencoded" },
	body: new URLSearchParams({
		grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
		assertion: createServiceAccountAssertion(serviceAccountCredentials),
	}),
});
const token = await readJsonResponse(tokenResponse, "Service account access token request");
if (typeof token.access_token !== "string" || token.access_token.length === 0) {
	throw new Error("Service account access token request did not return an access token");
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
