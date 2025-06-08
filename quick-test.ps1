# Quick Test Script cho Native Messaging Setup
Write-Host "Quick Test - Native Messaging Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. Kiem tra cac file can thiet
Write-Host "`n1. Kiem tra files..." -ForegroundColor Yellow

$requiredFiles = @(
    ".\Extension Setup\manifest.json",
    ".\Extension Setup\background.js", 
    ".\Extension Setup\content.js",
    ".\Extension Setup\panel.html",
    ".\Extension Setup\panel.js",
    ".\native-host\host.js",
    ".\native-host\com.zalocrawler.host.json",
    ".\src\components\PairedMode.js",
    ".\main.js",
    ".\preload.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   OK $file" -ForegroundColor Green
    } else {
        Write-Host "   MISSING $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`nThieu $($missingFiles.Count) file(s). Vui long kiem tra lai." -ForegroundColor Red
    exit 1
}

# 2. Kiem tra Node.js
Write-Host "`n2. Kiem tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Node.js khong duoc cai dat" -ForegroundColor Red
    exit 1
}

# 3. Kiem tra npm packages
Write-Host "`n3. Kiem tra npm packages..." -ForegroundColor Yellow
if (Test-Path ".\package.json") {
    Write-Host "   OK package.json ton tai" -ForegroundColor Green
    if (Test-Path ".\node_modules") {
        Write-Host "   OK node_modules ton tai" -ForegroundColor Green
    } else {
        Write-Host "   WARNING node_modules khong ton tai. Chay 'npm install'" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERROR package.json khong ton tai" -ForegroundColor Red
}

# 4. Kiem tra Native Host Manifest
Write-Host "`n4. Kiem tra Native Host Manifest..." -ForegroundColor Yellow
$manifestPath = ".\native-host\com.zalocrawler.host.json"
try {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host "   OK Manifest JSON hop le" -ForegroundColor Green
    Write-Host "   Name: $($manifest.name)" -ForegroundColor Gray
    Write-Host "   Path: $($manifest.path)" -ForegroundColor Gray
    Write-Host "   Allowed Origins: $($manifest.allowed_origins -join ', ')" -ForegroundColor Gray
    
    # Kiem tra Extension ID
    if ($manifest.allowed_origins -and $manifest.allowed_origins[0] -match "chrome-extension://([a-z]+)/") {
        $extensionId = $matches[1]
        Write-Host "   OK Extension ID: $extensionId" -ForegroundColor Green
    } else {
        Write-Host "   WARNING Extension ID chua duoc cap nhat" -ForegroundColor Yellow
        Write-Host "   Chay: .\update-extension-id.ps1 -ExtensionId YOUR_ID" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ERROR Manifest JSON khong hop le: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Kiem tra Registry
Write-Host "`n5. Kiem tra Windows Registry..." -ForegroundColor Yellow
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"
try {
    $registryValue = Get-ItemProperty -Path $registryPath -ErrorAction Stop
    Write-Host "   OK Native Host da duoc dang ky trong Registry" -ForegroundColor Green
    Write-Host "   Path: $($registryValue.'(default)')" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Native Host chua duoc dang ky trong Registry" -ForegroundColor Red
    Write-Host "   Chay: .\install-native-host.ps1" -ForegroundColor Cyan
}

# 6. Test Native Host
Write-Host "`n6. Test Native Host..." -ForegroundColor Yellow
try {
    $testResult = node .\test-native-messaging.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Native Host test thanh cong" -ForegroundColor Green
    } else {
        Write-Host "   ERROR Native Host test that bai" -ForegroundColor Red
        Write-Host "   Output: $testResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERROR Khong the chay test: $($_.Exception.Message)" -ForegroundColor Red
}

# Tong ket
Write-Host "`nTONG KET" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

Write-Host "`nCac buoc tiep theo:" -ForegroundColor Yellow
Write-Host "1. Load Extension vao Chrome (chrome://extensions/)" -ForegroundColor White
Write-Host "2. Copy Extension ID va chay: .\update-extension-id.ps1 -ExtensionId YOUR_ID" -ForegroundColor White
Write-Host "3. Chay: .\install-native-host.ps1" -ForegroundColor White
Write-Host "4. Khoi dong Electron App: npm start" -ForegroundColor White
Write-Host "5. Test communication giua Extension va Electron" -ForegroundColor White

Write-Host "`nTest Communication:" -ForegroundColor Yellow
Write-Host "• Extension Popup -> Click 'Test Electron'" -ForegroundColor White
Write-Host "• Extension Tab -> 'Native Messaging' -> 'Test Ket Noi'" -ForegroundColor White
Write-Host "• Zalo Page -> Click nut floating 'Test Electron'" -ForegroundColor White
Write-Host "• Electron App -> 'Che do ket noi' -> Xem tin nhan" -ForegroundColor White

Write-Host "`nXem huong dan chi tiet: TEST_GUIDE.md" -ForegroundColor Cyan 