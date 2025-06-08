// Test script for Native Messaging
const { spawn } = require("child_process");
const path = require("path");

console.log("🧪 Testing Native Messaging Setup...\n");

// Test 1: Check if native host file exists
const nativeHostPath = path.join(__dirname, "native-host", "host.js");
const fs = require("fs");

console.log("1. Checking native host file...");
if (fs.existsSync(nativeHostPath)) {
  console.log("✅ Native host file exists:", nativeHostPath);
} else {
  console.log("❌ Native host file not found:", nativeHostPath);
  process.exit(1);
}

// Test 2: Check if manifest file exists
const manifestPath = path.join(
  __dirname,
  "native-host",
  "com.zalocrawler.host.json"
);
console.log("\n2. Checking manifest file...");
if (fs.existsSync(manifestPath)) {
  console.log("✅ Manifest file exists:", manifestPath);

  // Read and validate manifest
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    console.log("✅ Manifest is valid JSON");
    console.log("   Name:", manifest.name);
    console.log("   Description:", manifest.description);
    console.log("   Path:", manifest.path);
    console.log("   Args:", manifest.args);
  } catch (error) {
    console.log("❌ Manifest JSON is invalid:", error.message);
  }
} else {
  console.log("❌ Manifest file not found:", manifestPath);
}

// Test 3: Try to run native host
console.log("\n3. Testing native host execution...");
try {
  const testProcess = spawn("node", [nativeHostPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let hasOutput = false;

  testProcess.stderr.on("data", (data) => {
    const output = data.toString();
    if (output.includes("Native host started")) {
      console.log("✅ Native host started successfully");
      hasOutput = true;
      testProcess.kill();
    }
  });

  testProcess.on("error", (error) => {
    console.log("❌ Failed to start native host:", error.message);
  });

  testProcess.on("exit", (code) => {
    if (!hasOutput) {
      console.log("❌ Native host exited without expected output");
    }
  });

  // Kill after 3 seconds if still running
  setTimeout(() => {
    if (!testProcess.killed) {
      testProcess.kill();
      if (!hasOutput) {
        console.log("❌ Native host test timeout");
      }
    }
  }, 3000);
} catch (error) {
  console.log("❌ Error testing native host:", error.message);
}

// Test 4: Check registry (Windows only)
if (process.platform === "win32") {
  console.log("\n4. Checking Windows registry...");
  const { exec } = require("child_process");

  exec(
    'reg query "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.zalocrawler.host"',
    (error, stdout, stderr) => {
      if (error) {
        console.log("❌ Native host not registered in Chrome registry");
        console.log("   Run install-native-host.ps1 to register");
      } else {
        console.log("✅ Native host registered in Chrome registry");
      }
    }
  );
}

console.log("\n📋 Test Summary:");
console.log("- If all tests pass, the native messaging should work");
console.log(
  "- Make sure to run install-native-host.ps1 if registry test fails"
);
console.log("- Restart Chrome after installing the native host");
console.log("- Load the extension and test on https://chat.zalo.me");

setTimeout(() => {
  console.log("\n🏁 Test completed");
}, 4000);
