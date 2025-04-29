(async () => {
    const src = chrome.runtime.getURL("src/content.js");
  
    console.log("Loading content script module:", src);
    try {
      await import(src);
      console.log("Content script module loaded successfully.");
    } catch (error) {
      console.error("Failed to load content script module:", error);
    }
  })();