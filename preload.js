const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  organizeImages: (data) => ipcRenderer.invoke("organize-images", data),

  // Preview functionality
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  formatFolderName: (text) => ipcRenderer.invoke("format-folder-name", text),
  generateThumbnail: (imagePath, width, height) =>
    ipcRenderer.invoke("generate-thumbnail", imagePath, width, height),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  unmaximizeWindow: () => ipcRenderer.invoke("window-unmaximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),

  // Window state listeners
  onWindowMaximized: (callback) => {
    ipcRenderer.on("window-maximized", callback);
  },
  onWindowUnmaximized: (callback) => {
    ipcRenderer.on("window-unmaximized", callback);
  },

  // Native messaging
  sendToExtension: (message) =>
    ipcRenderer.invoke("send-to-extension", message),
  onNativeMessage: (callback) => {
    ipcRenderer.on("native-message", (event, message) => callback(message));
  },

  // Listen for extension messages (alias for native messages)
  onExtensionMessage: (callback) => {
    ipcRenderer.on("native-message", (event, message) => {
      callback(message);
    });
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Log that preload script has loaded
console.log("Preload script loaded successfully");
