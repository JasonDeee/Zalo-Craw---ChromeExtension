// Native messaging host for Zalo Crawler
const { spawn } = require('child_process');
const path = require('path');

// Get the path to the Electron app
const electronAppPath = path.join(__dirname, '..', 'main.js');

// Start the Electron app
const electronProcess = spawn('electron', [electronAppPath], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

// Handle messages from the extension
process.on('message', (message) => {
  if (message && message.action === 'GET_RANDOM_TOKEN') {
    // Forward the message to the Electron app
    electronProcess.send(message);
  }
});

// Handle messages from the Electron app
electronProcess.on('message', (message) => {
  // Forward the message to the extension
  if (process.send) {
    process.send(message);
  }
});

// Handle errors
electronProcess.stderr.on('data', (data) => {
  console.error(`Electron stderr: ${data}`);
});

electronProcess.on('error', (error) => {
  console.error('Failed to start Electron process:', error);
});

// Handle process exit
process.on('exit', () => {
  electronProcess.kill();
});

// Keep the process alive
process.stdin.resume();
