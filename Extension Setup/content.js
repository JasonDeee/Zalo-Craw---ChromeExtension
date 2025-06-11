// Content script for Zalo Crawler Extension
console.log("Zalo Crawler content script loaded");

// Create floating Getting Ready button
function createGettingReadyButton() {
  // Check if button already exists
  if (document.getElementById("zalo-crawler-ready-btn")) {
    return;
  }

  const button = document.createElement("div");
  button.id = "zalo-crawler-ready-btn";
  button.innerHTML = "🎯 Crawler Setup";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    user-select: none;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  `;

  // Add hover effects
  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-2px) scale(1.05)";
    button.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
    button.style.background =
      "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0) scale(1)";
    button.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
    button.style.background =
      "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
  });

  // Add click handler
  button.addEventListener("click", () => {
    openGettingReadyPopup();
  });

  document.body.appendChild(button);
  console.log("Getting Ready button created and added to page");
}

// Open Getting Ready popup manually
function openGettingReadyPopup() {
  console.log("🎯 Opening Getting Ready popup manually...");

  // Check if ZaloCrawlerGettingReady class exists
  if (typeof ZaloCrawlerGettingReady !== "undefined") {
    // Create new instance of Getting Ready system
    new ZaloCrawlerGettingReady();
  } else {
    console.error(
      "ZaloCrawlerGettingReady class not found. Make sure GettingReady.js is loaded."
    );

    // Show fallback notification
    showNotification(
      "❌ Lỗi: Không thể mở Getting Ready popup. Vui lòng refresh trang."
    );
  }
}

// HIDDEN - Original Test Electron functionality (giữ nguyên chức năng)
// Create floating test button (HIDDEN)
function createTestButton() {
  // Test Electron button bị ẩn nhưng vẫn giữ nguyên chức năng
  // Có thể gọi trực tiếp sendTestMessage() từ console nếu cần
  console.log("Test Electron functionality available via sendTestMessage()");
}

// Send test message to Electron via native messaging
function sendTestMessage() {
  const testMessage = {
    action: "TEST_FROM_EXTENSION",
    timestamp: Date.now(),
    url: window.location.href,
    message: "Xin chào từ Zalo Extension! 👋",
    data: {
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      testNumber: Math.floor(Math.random() * 1000),
    },
  };

  console.log("Sending test message:", testMessage);

  // Update button to show sending state
  const button = document.getElementById("zalo-crawler-test-btn");
  const originalText = button.innerHTML;
  button.innerHTML = "📤 Đang gửi...";
  button.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";

  // Send message to background script
  chrome.runtime.sendMessage(
    {
      action: "SEND_TO_ELECTRON",
      data: testMessage,
    },
    (response) => {
      console.log("Response from background:", response);

      // Update button based on response
      setTimeout(() => {
        if (response && response.success) {
          button.innerHTML = "✅ Đã gửi!";
          button.style.background =
            "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)";
        } else {
          button.innerHTML = "❌ Lỗi!";
          button.style.background =
            "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)";
        }

        // Reset button after 2 seconds
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background =
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        }, 2000);
      }, 500);
    }
  );
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "FROM_ELECTRON") {
    console.log("Message from Electron:", request.data);

    // Show notification on page
    showNotification(
      "Nhận tin nhắn từ Electron: " + JSON.stringify(request.data)
    );

    sendResponse({ success: true, received: true });
  }

  return true;
});

// Show notification on page
function showNotification(message) {
  // Remove existing notification
  const existing = document.getElementById("zalo-crawler-notification");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.id = "zalo-crawler-notification";
  notification.innerHTML = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Initialize when page loads
function init() {
  // Wait for page to be fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createGettingReadyButton);
  } else {
    createGettingReadyButton();
  }
}

// Start initialization
init();
