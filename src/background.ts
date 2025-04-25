console.log("Hikka Forge Extension background script running");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});