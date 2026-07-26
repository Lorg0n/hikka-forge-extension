(async () => {
    const src = chrome.runtime.getURL("src/content.js");

    try {
      await import(src);
    } catch (error) {
    }
  })();
