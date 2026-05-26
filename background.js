chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "quicklook-extract",
    title: "Extract with QuickLook",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "quicklook-extract" && info.selectionText) {
    // Store the highlighted text
    chrome.storage.local.set({ "quicklookPendingText": info.selectionText }, () => {
      // Show a visual indicator on the extension icon
      chrome.action.setBadgeText({ text: "1" });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e" }); // Green badge
    });
  }
});
