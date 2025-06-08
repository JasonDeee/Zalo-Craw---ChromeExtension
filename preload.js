const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),

  // File system operations
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  organizeImages: (data) => ipcRenderer.invoke("organize-images", data),

  // Native messaging
  sendToExtension: (message) =>
    ipcRenderer.invoke("send-to-extension", message),

  // Listen for native messages
  onNativeMessage: (callback) => {
    ipcRenderer.on("native-message", (event, message) => {
      callback(message);
    });
  },

  // Listen for extension messages (alias for native messages)
  onExtensionMessage: (callback) => {
    ipcRenderer.on("native-message", (event, message) => {
      callback(message);
    });
  },

  // Window state listeners
  onWindowMaximized: (callback) => {
    ipcRenderer.on("window-maximized", callback);
  },

  onWindowUnmaximized: (callback) => {
    ipcRenderer.on("window-unmaximized", callback);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Log that preload script has loaded
console.log("Preload script loaded successfully");
