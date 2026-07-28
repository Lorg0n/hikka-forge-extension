(async () => {
  // Manifest content scripts are classic scripts, so this entry cannot use
  // ESM imports. Prefer the standard browser namespace when it is available.
  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const src = extensionApi.runtime.getURL("src/content.js");

  try {
    await import(src);
  } catch {
    // A failed dynamic import is non-fatal: the host page stays usable.
  }
})();
