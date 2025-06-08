// Test script để kiểm tra native messaging
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEMP_DIR = path.join(os.tmpdir(), "zalo-crawler");
const MESSAGE_FILE = path.join(TEMP_DIR, "extension-message.json");
const RESPONSE_FILE = path.join(TEMP_DIR, "electron-response.json");

console.log("🧪 Testing Native Messaging File System...");
console.log("Temp directory:", TEMP_DIR);
console.log("Message file:", MESSAGE_FILE);
console.log("Response file:", RESPONSE_FILE);

// Tạo thư mục temp nếu chưa tồn tại
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log("✅ Created temp directory");
} else {
  console.log("✅ Temp directory exists");
}

// Tạo tin nhắn test
const testMessage = {
  timestamp: Date.now(),
  source: "test_script",
  data: {
    action: "TEST_FROM_SCRIPT",
    message: "Test tin nhắn từ script! 🚀",
    testId: Math.floor(Math.random() * 10000),
  },
};

console.log("\n📤 Sending test message...");
console.log("Message:", JSON.stringify(testMessage, null, 2));

// Ghi tin nhắn vào file
try {
  fs.writeFileSync(MESSAGE_FILE, JSON.stringify(testMessage, null, 2));
  console.log("✅ Message written to file");
} catch (error) {
  console.error("❌ Error writing message:", error);
  process.exit(1);
}

// Đợi phản hồi
console.log("\n⏳ Waiting for response from Electron app...");

let attempts = 0;
const maxAttempts = 10;

const checkForResponse = () => {
  attempts++;

  if (fs.existsSync(RESPONSE_FILE)) {
    try {
      const response = JSON.parse(fs.readFileSync(RESPONSE_FILE, "utf8"));
      console.log("\n📥 Received response:");
      console.log(JSON.stringify(response, null, 2));

      // Xóa file response
      fs.unlinkSync(RESPONSE_FILE);
      console.log("✅ Test completed successfully!");

      if (response.success) {
        console.log("🎉 Native messaging is working!");
      } else {
        console.log("⚠️ Response indicates an error");
      }
    } catch (error) {
      console.error("❌ Error reading response:", error);
    }
  } else if (attempts < maxAttempts) {
    console.log(`⏳ Attempt ${attempts}/${maxAttempts} - waiting...`);
    setTimeout(checkForResponse, 1000);
  } else {
    console.log("❌ No response received after 10 seconds");
    console.log("Make sure Electron app is running!");
  }
};

// Bắt đầu kiểm tra phản hồi
setTimeout(checkForResponse, 1000);
