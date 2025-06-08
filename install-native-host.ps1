# Install Native Host for Windows

Write-Host "Installing Zalo Crawler Native Host..." -ForegroundColor Yellow

# Path to the native host directory
$nativeHostDir = "$PSScriptRoot\native-host"
$hostManifestPath = "$nativeHostDir\com.zalocrawler.host.json"

# Check if native host directory exists
if (-not (Test-Path $nativeHostDir)) {
    Write-Host "Error: Native host directory not found at $nativeHostDir" -ForegroundColor Red
    exit 1
}

# Check if manifest file exists
if (-not (Test-Path $hostManifestPath)) {
    Write-Host "Error: Manifest file not found at $hostManifestPath" -ForegroundColor Red
    exit 1
}

# Update the host path in the manifest to use absolute path
$hostPath = "$nativeHostDir\host.js"
$hostPath = $hostPath.Replace("\", "/")  # Use forward slashes for JSON

Write-Host "Host path: $hostPath" -ForegroundColor Cyan

# Read the manifest content
try {
    $manifestContent = Get-Content -Path $hostManifestPath -Raw | ConvertFrom-Json
    $manifestContent.path = $hostPath
    $manifestContent | ConvertTo-Json -Depth 10 | Set-Content -Path $hostManifestPath
    Write-Host "Updated manifest file with correct path" -ForegroundColor Green
} catch {
    Write-Host "Error updating manifest file: $_" -ForegroundColor Red
    exit 1
}

# Register the native host for Chrome
$chromeRegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"
$registryValue = $hostManifestPath

try {
    # Create the registry key for Chrome
    New-Item -Path $chromeRegistryPath -Force | Out-Null
    Set-ItemProperty -Path $chromeRegistryPath -Name '(Default)' -Value $registryValue -Type String
    Write-Host "Registered native host for Chrome" -ForegroundColor Green
} catch {
    Write-Host "Error registering for Chrome: $_" -ForegroundColor Red
}

# Also register for Edge (optional)
$edgeRegistryPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.zalocrawler.host"

try {
    New-Item -Path $edgeRegistryPath -Force | Out-Null
    Set-ItemProperty -Path $edgeRegistryPath -Name '(Default)' -Value $registryValue -Type String
    Write-Host "Registered native host for Edge" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not register for Edge: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Native host installation completed!" -ForegroundColor Green
Write-Host "Please restart your browser for the changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "To test the connection:" -ForegroundColor Cyan
Write-Host "1. Load the extension in Chrome" -ForegroundColor White
Write-Host "2. Open Zalo Web (https://chat.zalo.me)" -ForegroundColor White
Write-Host "3. Start the Electron app" -ForegroundColor White
Write-Host "4. Click the test button on the Zalo page" -ForegroundColor White
