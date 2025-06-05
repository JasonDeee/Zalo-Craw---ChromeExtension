const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handler to get the random token from the extension
ipcMain.handle('get-extension-token', async (event, extensionId) => {
  return new Promise((resolve, reject) => {
    try {
      // This is a simplified example. In a real app, you would use Chrome's native messaging
      // Here we're just simulating the communication
      const message = {
        action: 'GET_RANDOM_TOKEN'
      };

      // In a real implementation, you would use Chrome's native messaging API
      // This is just a simulation that would work with our extension's message listener
      const response = { token: 'meag@bhjkdfs' }; // This would come from the extension
      
      if (response && response.token) {
        resolve({ success: true, token: response.token });
      } else {
        resolve({ success: false, error: 'No token found in extension' });
      }
    } catch (error) {
      console.error('Error getting token from extension:', error);
      resolve({ success: false, error: error.message });
    }
  });
});
