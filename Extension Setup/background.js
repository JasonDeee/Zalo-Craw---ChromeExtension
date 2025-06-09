// Background script for handling native messaging
chrome.runtime.onInstalled.addListener(() => {
  console.log("Zalo Crawler extension installed");
});

// Native messaging port
let nativePort = null;

// Connect to native host
function connectToNativeHost() {
  try {
    nativePort = chrome.runtime.connectNative("com.zalocrawler.host");

    nativePort.onMessage.addListener((message) => {
      console.log("Received message from native host:", message);

      // Forward message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "FROM_ELECTRON",
            data: message,
          });
        }
      });
    });

    nativePort.onDisconnect.addListener(() => {
      console.log("Disconnected from native host");
      nativePort = null;
    });

    console.log("Connected to native host successfully");
  } catch (error) {
    console.error("Failed to connect to native host:", error);
  }
}

// Send message to native host
function sendToNativeHost(message) {
  if (!nativePort) {
    connectToNativeHost();
  }

  if (nativePort) {
    try {
      nativePort.postMessage(message);
      return { success: true };
    } catch (error) {
      console.error("Error sending to native host:", error);
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: "Not connected to native host" };
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

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

  if (request.action === "SEND_TO_ELECTRON") {
    // Send message to Electron via native messaging
    const result = sendToNativeHost(request.data);
    sendResponse(result);
    return true;
  }

  if (request.action === "COPY_TO_CLIPBOARD") {
    // Handle clipboard copy using chrome.action API
    try {
      // Create offscreen document to handle clipboard operations
      chrome.offscreen
        .createDocument({
          url: "offscreen.html",
          reasons: ["CLIPBOARD"],
          justification: "Copy text to clipboard",
        })
        .then(() => {
          chrome.runtime.sendMessage({
            action: "OFFSCREEN_COPY",
            text: request.text,
          });
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.log("Offscreen method failed, trying direct method");
          // Fallback: try direct write (may not work in all contexts)
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(request.text)
              .then(() => {
                sendResponse({ success: true });
              })
              .catch((err) => {
                sendResponse({ success: false, error: err.message });
              });
          } else {
            sendResponse({
              success: false,
              error: "Clipboard API not available",
            });
          }
        });
      return true;
    } catch (error) {
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }

  return true;
});

// Lưu trữ tạm thời thông tin tải xuống
let pendingDownloads = {};

// Lắng nghe sự kiện khi một tải xuống mới được tạo
chrome.downloads.onCreated.addListener(function (downloadItem) {
  console.log("Phát hiện tải xuống mới:", downloadItem);

  // Lưu thông tin tải xuống vào bộ nhớ tạm
  pendingDownloads[downloadItem.id] = {
    id: downloadItem.id,
    url: downloadItem.url,
    timestamp: Date.now(),
  };

  // Chưa gửi thông báo ngay vì filename có thể chưa có
});

// Lắng nghe sự kiện khi trạng thái tải xuống thay đổi
chrome.downloads.onChanged.addListener(function (downloadDelta) {
  console.log("Tải xuống thay đổi:", downloadDelta);

  // Kiểm tra xem có thay đổi về tên file không
  if (downloadDelta.filename) {
    const downloadId = downloadDelta.id;

    // Lấy thông tin tải xuống từ bộ nhớ tạm
    if (pendingDownloads[downloadId]) {
      // Lấy tên file từ đường dẫn đầy đủ
      const filename = downloadDelta.filename.current
        .split("\\")
        .pop()
        .split("/")
        .pop();

      console.log(
        `Tên file đã được cập nhật: ${filename} cho ID: ${downloadId}`
      );

      // Gửi thông tin tải xuống đến panel.js
      chrome.runtime.sendMessage({
        action: "DOWNLOAD_CREATED",
        downloadItem: {
          id: downloadId,
          filename: filename,
          url: pendingDownloads[downloadId].url,
          timestamp: pendingDownloads[downloadId].timestamp,
        },
      });
    }
  }

  // Kiểm tra xem tải xuống đã hoàn thành chưa
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    const downloadId = downloadDelta.id;

    // Lấy thông tin chi tiết về tải xuống
    chrome.downloads.search({ id: downloadId }, function (downloads) {
      if (downloads && downloads.length > 0) {
        const download = downloads[0];
        const filename = download.filename.split("\\").pop().split("/").pop();

        console.log(`Tải xuống hoàn thành: ${filename}`);

        // Gửi thông tin tải xuống hoàn thành đến panel.js
        chrome.runtime.sendMessage({
          action: "DOWNLOAD_COMPLETED",
          downloadItem: {
            id: downloadId,
            filename: filename,
            url: download.url,
            timestamp: Date.now(),
          },
        });

        // Xóa khỏi bộ nhớ tạm
        delete pendingDownloads[downloadId];
      }
    });
  }
});
