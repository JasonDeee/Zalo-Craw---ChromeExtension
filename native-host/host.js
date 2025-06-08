// Native messaging host for Zalo Crawler
const fs = require("fs");
const path = require("path");
const os = require("os");

// Đường dẫn file để giao tiếp với Electron app
const TEMP_DIR = path.join(os.tmpdir(), "zalo-crawler");
const MESSAGE_FILE = path.join(TEMP_DIR, "extension-message.json");
const RESPONSE_FILE = path.join(TEMP_DIR, "electron-response.json");

// Tạo thư mục temp nếu chưa tồn tại
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Native messaging protocol functions
function readMessage() {
  return new Promise((resolve, reject) => {
    const lengthBuffer = Buffer.alloc(4);
    const bytesRead = process.stdin.read(lengthBuffer);

    if (!bytesRead || lengthBuffer.length === 0) {
      resolve(null);
      return;
    }

    const messageLength = lengthBuffer.readUInt32LE(0);
    const messageBuffer = Buffer.alloc(messageLength);
    process.stdin.read(messageBuffer);

    try {
      const message = JSON.parse(messageBuffer.toString());
      resolve(message);
    } catch (error) {
      reject(error);
    }
  });
}

function sendMessage(message) {
  const messageString = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageString);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

  process.stdout.write(lengthBuffer);
  process.stdout.write(messageBuffer);
}

// Ghi tin nhắn từ extension vào file
function writeMessageToFile(message) {
  try {
    const messageData = {
      timestamp: Date.now(),
      source: "extension",
      data: message,
    };

    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messageData, null, 2));
    console.error("Message written to file:", MESSAGE_FILE);
    return true;
  } catch (error) {
    console.error("Error writing message to file:", error);
    return false;
  }
}

// Đọc phản hồi từ Electron app
function readResponseFromFile() {
  try {
    if (fs.existsSync(RESPONSE_FILE)) {
      const responseData = JSON.parse(fs.readFileSync(RESPONSE_FILE, "utf8"));

      // Xóa file sau khi đọc
      fs.unlinkSync(RESPONSE_FILE);

      return responseData;
    }
    return null;
  } catch (error) {
    console.error("Error reading response from file:", error);
    return null;
  }
}

// Handle messages from the extension
async function handleExtensionMessage() {
  try {
    while (true) {
      const message = await readMessage();

      if (!message) {
        break;
      }

      console.error(
        "Received message from extension:",
        JSON.stringify(message)
      );

      // Ghi tin nhắn vào file để Electron app có thể đọc
      const written = writeMessageToFile(message);

      if (written) {
        // Đợi một chút để Electron app xử lý
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Đọc phản hồi từ file
        const response = readResponseFromFile() || {
          success: true,
          timestamp: Date.now(),
          receivedMessage: message,
          electronStatus: "connected_via_file",
          method: "file_system",
        };

        sendMessage(response);
      } else {
        // Gửi phản hồi lỗi
        sendMessage({
          success: false,
          error: "Failed to write message to file",
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error("Error handling extension message:", error);
  }
}

// Handle process exit
process.on("exit", () => {
  console.error("Native host exiting");

  // Dọn dẹp files
  try {
    if (fs.existsSync(MESSAGE_FILE)) {
      fs.unlinkSync(MESSAGE_FILE);
    }
    if (fs.existsSync(RESPONSE_FILE)) {
      fs.unlinkSync(RESPONSE_FILE);
    }
  } catch (error) {
    console.error("Error cleaning up files:", error);
  }
});

process.on("SIGINT", () => {
  console.error("Native host received SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Native host received SIGTERM");
  process.exit(0);
});

// Start listening for messages
console.error("Native host started, listening for messages...");
console.error("Temp directory:", TEMP_DIR);
console.error("Message file:", MESSAGE_FILE);
console.error("Response file:", RESPONSE_FILE);

handleExtensionMessage();
