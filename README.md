# Zalo Crawler - Electron App with Chrome Extension

This project consists of two main components:
1. A Chrome Extension that runs in the browser
2. A desktop Electron application that communicates with the extension

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Chrome Extension dependencies
cd "Extension Setup"
npm install
cd ..
```

### 2. Install Native Host (Windows)

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the installation script:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\install-native-host.ps1
```

### 3. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `Extension Setup` directory

### 4. Run the Electron Application

```bash
npm start
```

## How It Works

1. The Electron app provides a simple UI with a button to fetch a token
2. When clicked, it communicates with the Chrome extension using native messaging
3. The extension retrieves the `RandomTokenTest` value and sends it back to the Electron app
4. The token is displayed in the Electron app UI and shown in an alert

## Troubleshooting

- If you get a native host error, make sure the native host is properly installed
- Check the Chrome extension's background page console for any errors
- Make sure the extension ID in the code matches your actual extension ID

## Development

- The main Electron app code is in `main.js` and `index.html`
- The Chrome extension code is in the `Extension Setup` directory
- The native host bridge is in the `native-host` directory
