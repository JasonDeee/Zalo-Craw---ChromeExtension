const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { exec, spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false, // Ẩn title bar
    titleBarStyle: "hidden", // Ẩn title bar trên macOS
    icon: path.join(__dirname, "/Static/Favicon_64.ico"), // Icon cho window
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Window event listeners
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-unmaximized");
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Hàm để format text thành tên thư mục hợp lệ
function formatFolderName(text) {
  if (!text) return "Unnamed";

  // Loại bỏ các ký tự không hợp lệ cho tên thư mục
  let folderName = text
    .trim()
    // Loại bỏ các ký tự điều khiển (control characters) như \n, \r, \t
    .replace(/[\r\n\t\f\v]/g, " ")
    // Loại bỏ các ký tự whitespace kép thành single space
    .replace(/\s+/g, " ")
    // Thay thế các ký tự đặc biệt Windows không cho phép
    .replace(/[\\/:*?"<>|]/g, "-")
    // Loại bỏ các ký tự Unicode control characters
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    // Loại bỏ dấu chấm ở cuối tên (Windows không cho phép)
    .replace(/\.+$/g, "")
    // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
    .replace(/-+/g, "-")
    // Loại bỏ dấu gạch ngang và space ở đầu và cuối
    .replace(/^[-\s]+|[-\s]+$/g, "");

  // Kiểm tra tên thư mục không được là reserved names của Windows
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];

  if (reservedNames.includes(folderName.toUpperCase())) {
    folderName = `Folder_${folderName}`;
  }

  // Giới hạn độ dài tên thư mục (Windows cho phép max 255 ký tự)
  if (folderName.length > 200) {
    folderName = folderName.substring(0, 200).trim();
    // Loại bỏ dấu gạch ngang cuối nếu có sau khi cắt
    folderName = folderName.replace(/[-\s]+$/, "");
  }

  // Nếu sau khi format mà tên thư mục rỗng, đặt tên mặc định
  if (!folderName || folderName.length === 0) {
    folderName = "Unnamed_Folder";
  }

  // Đảm bảo tên thư mục không bắt đầu bằng dấu chấm (hidden folder)
  if (folderName.startsWith(".")) {
    folderName = "Folder_" + folderName;
  }

  return folderName;
}

// Hàm để tạo thư mục nếu chưa tồn tại
function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Hàm để di chuyển file
function moveFile(sourcePath, destinationPath) {
  try {
    // Kiểm tra xem file nguồn có tồn tại không
    if (!fs.existsSync(sourcePath)) {
      console.warn(`File không tồn tại: ${sourcePath}`);
      return false;
    }

    // Sao chép file
    fs.copyFileSync(sourcePath, destinationPath);

    // Kiểm tra xem file đã được sao chép thành công chưa
    if (fs.existsSync(destinationPath)) {
      // Xóa file sau khi đã di chuyển
      fs.unlinkSync(sourcePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      `Lỗi khi di chuyển file ${sourcePath} đến ${destinationPath}:`,
      error
    );
    return false;
  }
}

// IPC handler để chọn thư mục
ipcMain.handle("select-folder", async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    return result;
  } catch (error) {
    console.error("Lỗi khi chọn thư mục:", error);
    return { canceled: true, error: error.message };
  }
});

// IPC handlers cho window controls
ipcMain.handle("window-minimize", async (event) => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("window-maximize", async (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      // Send event to renderer to update button icon
      mainWindow.webContents.send("window-unmaximized");
    } else {
      mainWindow.maximize();
      // Send event to renderer to update button icon
      mainWindow.webContents.send("window-maximized");
    }
  }
});

ipcMain.handle("window-unmaximize", async (event) => {
  if (mainWindow && mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.webContents.send("window-unmaximized");
  }
});

ipcMain.handle("window-close", async (event) => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// IPC handler để tổ chức hình ảnh
ipcMain.handle("organize-images", async (event, { folderPath, clients }) => {
  try {
    // Kiểm tra xem thư mục có tồn tại không
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: "Thư mục không tồn tại" };
    }

    const createdFolders = [];
    let movedFiles = 0;
    let errors = [];

    // Xử lý từng client
    for (const client of clients) {
      // Format tên thư mục
      const folderName = formatFolderName(client.text);
      console.log(`Original text: "${client.text}"`);
      console.log(`Formatted folder name: "${folderName}"`);

      // Tạo đường dẫn đầy đủ cho thư mục mới
      const clientFolderPath = path.join(folderPath, folderName);

      // Tạo thư mục nếu chưa tồn tại
      createDirectoryIfNotExists(clientFolderPath);
      createdFolders.push(folderName);

      // Di chuyển các file ảnh vào thư mục
      if (client.image_names && Array.isArray(client.image_names)) {
        for (const imageName of client.image_names) {
          const sourceImagePath = path.join(folderPath, imageName);
          const destImagePath = path.join(clientFolderPath, imageName);

          // Di chuyển file
          const moved = moveFile(sourceImagePath, destImagePath);
          if (moved) {
            movedFiles++;
          } else {
            errors.push(`Không thể di chuyển file: ${imageName}`);
          }
        }
      }
    }

    return {
      success: true,
      createdFolders,
      movedFiles,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error("Lỗi khi tổ chức hình ảnh:", error);
    return { success: false, error: error.message };
  }
});

// IPC handler để quét thư mục và lấy danh sách file
ipcMain.handle("scan-folder", async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      throw new Error("Thư mục không tồn tại");
    }

    const files = await fs.promises.readdir(folderPath);

    // Lọc chỉ lấy file ảnh và video
    const mediaExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webm",
      ".jfif",
      ".bmp",
      ".webp",
      ".svg",
      ".tiff",
      ".mp4",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".mkv",
      ".m4v",
    ];

    const mediaFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return mediaExtensions.includes(ext);
    });

    return mediaFiles;
  } catch (error) {
    console.error("Lỗi khi quét thư mục:", error);
    throw error;
  }
});

// IPC handler để format tên thư mục
ipcMain.handle("format-folder-name", async (event, text) => {
  try {
    return formatFolderName(text);
  } catch (error) {
    console.error("Lỗi khi format tên thư mục:", error);
    return text; // Fallback
  }
});

// IPC handler để tạo thumbnail
ipcMain.handle(
  "generate-thumbnail",
  async (event, imagePath, width = 96, height = 96) => {
    try {
      const { nativeImage } = require("electron");

      if (!fs.existsSync(imagePath)) {
        throw new Error("File không tồn tại");
      }

      // Tạo nativeImage từ file path
      const image = nativeImage.createFromPath(imagePath);

      if (image.isEmpty()) {
        throw new Error("Không thể đọc file ảnh");
      }

      // Resize image với quality tốt
      const resized = image.resize({
        width,
        height,
        quality: "good",
      });

      // Convert to data URL
      const dataUrl = resized.toDataURL();

      return dataUrl;
    } catch (error) {
      console.error("Lỗi khi tạo thumbnail:", error);
      throw error;
    }
  }
);

// Native Messaging support
const TEMP_DIR = path.join(os.tmpdir(), "zalo-crawler");
const MESSAGE_FILE = path.join(TEMP_DIR, "extension-message.json");
const RESPONSE_FILE = path.join(TEMP_DIR, "electron-response.json");

let messageWatcher = null;

// Start native messaging file watcher when app is ready
app.whenReady().then(() => {
  startNativeMessagingWatcher();
});

function startNativeMessagingWatcher() {
  try {
    // Tạo thư mục temp nếu chưa tồn tại
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    console.log("Starting native messaging file watcher...");
    console.log("Watching directory:", TEMP_DIR);
    console.log("Message file:", MESSAGE_FILE);
    console.log("Response file:", RESPONSE_FILE);

    // Theo dõi thư mục temp để phát hiện tin nhắn mới
    messageWatcher = fs.watch(TEMP_DIR, (eventType, filename) => {
      if (eventType === "change" && filename === "extension-message.json") {
        handleExtensionMessage();
      }
    });

    console.log("Native messaging file watcher started successfully");
  } catch (error) {
    console.error("Failed to start native messaging file watcher:", error);
  }
}

function handleExtensionMessage() {
  try {
    if (fs.existsSync(MESSAGE_FILE)) {
      const messageData = JSON.parse(fs.readFileSync(MESSAGE_FILE, "utf8"));
      console.log("Received message from extension via file:", messageData);

      // Forward message to renderer process
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send("native-message", messageData);
      }

      // Tạo phản hồi
      const response = {
        success: true,
        timestamp: Date.now(),
        receivedMessage: messageData,
        electronStatus: "connected",
        method: "file_system",
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
      };

      // Ghi phản hồi vào file
      fs.writeFileSync(RESPONSE_FILE, JSON.stringify(response, null, 2));
      console.log("Response written to file:", RESPONSE_FILE);

      // Xóa file tin nhắn sau khi xử lý
      fs.unlinkSync(MESSAGE_FILE);
    }
  } catch (error) {
    console.error("Error handling extension message:", error);

    // Ghi phản hồi lỗi
    try {
      const errorResponse = {
        success: false,
        error: error.message,
        timestamp: Date.now(),
        method: "file_system",
      };
      fs.writeFileSync(RESPONSE_FILE, JSON.stringify(errorResponse, null, 2));
    } catch (writeError) {
      console.error("Error writing error response:", writeError);
    }
  }
}

// IPC handlers for native messaging
ipcMain.handle("send-to-extension", async (event, message) => {
  try {
    // Ghi tin nhắn vào file để native host có thể đọc
    const messageData = {
      timestamp: Date.now(),
      source: "electron",
      data: message,
    };

    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messageData, null, 2));
    console.log("Message sent to extension via file:", MESSAGE_FILE);

    return { success: true, method: "file_system" };
  } catch (error) {
    console.error("Error sending to extension:", error);
    return { success: false, error: error.message };
  }
});

// Handle app quit
app.on("before-quit", () => {
  if (messageWatcher) {
    messageWatcher.close();
    messageWatcher = null;
  }

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
