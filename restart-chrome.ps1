# Script để restart Chrome sau khi sửa Native Host
Write-Host "Restart Chrome cho Native Host" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# 1. Tìm và đóng tất cả Chrome processes
Write-Host "`n1. Dong tat ca Chrome processes..." -ForegroundColor Yellow

try {
    $chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
    if ($chromeProcesses) {
        Write-Host "   Tim thay $($chromeProcesses.Count) Chrome process(es)" -ForegroundColor Gray
        
        # Đóng Chrome một cách graceful trước
        Write-Host "   Dang dong Chrome gracefully..." -ForegroundColor Gray
        $chromeProcesses | ForEach-Object { $_.CloseMainWindow() }
        
        # Đợi 3 giây
        Start-Sleep -Seconds 3
        
        # Kiểm tra lại và force kill nếu cần
        $remainingProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
        if ($remainingProcesses) {
            Write-Host "   Force killing remaining Chrome processes..." -ForegroundColor Yellow
            $remainingProcesses | Stop-Process -Force
        }
        
        Write-Host "   OK Da dong tat ca Chrome processes" -ForegroundColor Green
    } else {
        Write-Host "   OK Khong co Chrome process nao dang chay" -ForegroundColor Green
    }
} catch {
    Write-Host "   WARNING Loi khi dong Chrome: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Đợi một chút để system cleanup
Write-Host "`n2. Doi system cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   OK Hoan thanh" -ForegroundColor Green

# 3. Kiểm tra Native Host registry
Write-Host "`n3. Kiem tra Native Host registry..." -ForegroundColor Yellow
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"

try {
    $registryValue = Get-ItemProperty -Path $registryPath -ErrorAction Stop
    Write-Host "   OK Native Host da duoc dang ky" -ForegroundColor Green
    Write-Host "   Path: $($registryValue.'(default)')" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Native Host chua duoc dang ky" -ForegroundColor Red
    Write-Host "   Chay: .\install-native-host.ps1" -ForegroundColor Cyan
    exit 1
}

# 4. Khởi động Chrome với extension
Write-Host "`n4. Khoi dong Chrome..." -ForegroundColor Yellow

try {
    # Tìm Chrome executable
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
    )
    
    $chromePath = $null
    foreach ($path in $chromePaths) {
        if (Test-Path $path) {
            $chromePath = $path
            break
        }
    }
    
    if ($chromePath) {
        Write-Host "   Tim thay Chrome tai: $chromePath" -ForegroundColor Gray
        
        # Khởi động Chrome với extension page
        Start-Process -FilePath $chromePath -ArgumentList "chrome://extensions/" -WindowStyle Normal
        
        Write-Host "   OK Da khoi dong Chrome" -ForegroundColor Green
        Write-Host "   Chrome se mo trang Extensions" -ForegroundColor Gray
    } else {
        Write-Host "   WARNING Khong tim thay Chrome executable" -ForegroundColor Yellow
        Write-Host "   Vui long mo Chrome thu cong" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "   WARNING Loi khi khoi dong Chrome: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Vui long mo Chrome thu cong" -ForegroundColor Cyan
}

Write-Host "`nHUONG DAN TIEP THEO:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

Write-Host "`n1. Trong Chrome Extensions page:" -ForegroundColor Yellow
Write-Host "   - Bat 'Developer mode'" -ForegroundColor White
Write-Host "   - Load extension tu thu muc 'Extension Setup'" -ForegroundColor White
Write-Host "   - Kiem tra Extension ID: hckallnbimdlmhpihlbkbjokdmcnpjnk" -ForegroundColor White

Write-Host "`n2. Khoi dong Electron App:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White

Write-Host "`n3. Test Native Messaging:" -ForegroundColor Yellow
Write-Host "   - Click icon Extension -> 'Test Electron'" -ForegroundColor White
Write-Host "   - Hoac vao tab 'Native Messaging' -> 'Test Ket Noi'" -ForegroundColor White
Write-Host "   - Hoac vao https://chat.zalo.me -> Click nut floating" -ForegroundColor White

Write-Host "`n4. Kiem tra ket qua trong Electron:" -ForegroundColor Yellow
Write-Host "   - Click 'Che do ket noi'" -ForegroundColor White
Write-Host "   - Xem tin nhan tu Extension" -ForegroundColor White

Write-Host "`nLuu y: Neu van gap loi, thu restart may tinh." -ForegroundColor Red 