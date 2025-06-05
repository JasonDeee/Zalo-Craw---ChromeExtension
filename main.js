const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile("index.html");

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
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
    // Thay thế các ký tự đặc biệt bằng dấu gạch ngang
    .replace(/[\\/:*?"<>|]/g, "-")
    // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
    .replace(/-+/g, "-")
    // Loại bỏ dấu gạch ngang ở đầu và cuối
    .replace(/^-|-$/g, "");

  // Giới hạn độ dài tên thư mục
  if (folderName.length > 50) {
    folderName = folderName.substring(0, 50);
  }

  // Nếu sau khi format mà tên thư mục rỗng, đặt tên mặc định
  if (!folderName) {
    folderName = "Unnamed";
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
