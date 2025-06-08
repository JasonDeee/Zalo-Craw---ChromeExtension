// Script to generate extension key for consistent ID
const crypto = require("crypto");
const fs = require("fs");

// Generate a consistent private key based on extension name
const extensionName = "zalo-crawler-extension";
const seed = crypto.createHash("sha256").update(extensionName).digest();

// Generate RSA key pair
const { generateKeyPairSync } = crypto;
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Save private key
fs.writeFileSync("key.pem", privateKey);

// Convert public key to base64 for manifest
const publicKeyBase64 = publicKey
  .replace(/-----BEGIN PUBLIC KEY-----/, "")
  .replace(/-----END PUBLIC KEY-----/, "")
  .replace(/\n/g, "");

console.log("🔑 Extension Key Generated!");
console.log("📁 Private key saved to: key.pem");
console.log("📋 Public key for manifest.json:");
console.log(publicKeyBase64);

// Update manifest.json
const manifestPath = "./manifest.json";
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.key = publicKeyBase64;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("✅ Updated manifest.json with key");
} else {
  console.log("⚠️  manifest.json not found, please add key manually");
}

console.log("\n📝 Next steps:");
console.log("1. Load extension in Chrome");
console.log("2. Note the Extension ID");
console.log("3. Update native-host/com.zalocrawler.host.json with the ID");
console.log("4. Run install-native-host.ps1");
