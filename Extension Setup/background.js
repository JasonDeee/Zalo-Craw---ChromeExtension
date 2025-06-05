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
