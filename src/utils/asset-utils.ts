export function getAssetUrl(assetPath: string): string {
  if (assetPath.startsWith('chrome-extension://') || assetPath.startsWith('moz-extension://')) {
    return assetPath;
  }
  const normalizedPath = assetPath.replace(/^(\.\/|\/)/, '');
  return chrome.runtime.getURL(normalizedPath);
}

export function useAssetUrl(assetPath: string): string {
  return getAssetUrl(assetPath);
}