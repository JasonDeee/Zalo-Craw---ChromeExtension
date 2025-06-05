// Background script for handling native messaging
chrome.runtime.onInstalled.addListener(() => {
  console.log("Zalo Crawler extension installed");
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_RANDOM_TOKEN") {
    // Forward the message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    return true; // Required for async response
  }
});
