# Script để khắc phục lỗi file association cho Native Host
Write-Host "Khac phuc loi file association cho Native Host" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Xóa file association cho .js files với VS Code
Write-Host "`n1. Xoa file association cho .js files..." -ForegroundColor Yellow

try {
    # Xóa association trong HKEY_CURRENT_USER
    $jsAssocPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.js"
    if (Test-Path $jsAssocPath) {
        Remove-Item -Path "$jsAssocPath\UserChoice" -Force -ErrorAction SilentlyContinue
        Write-Host "   OK Da xoa UserChoice cho .js files" -ForegroundColor Green
    }
    
    # Xóa OpenWithProgids
    $openWithPath = "$jsAssocPath\OpenWithProgids"
    if (Test-Path $openWithPath) {
        Remove-Item -Path $openWithPath -Force -ErrorAction SilentlyContinue
        Write-Host "   OK Da xoa OpenWithProgids cho .js files" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   WARNING Khong the xoa file association: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Kiểm tra Native Host registry
Write-Host "`n2. Kiem tra Native Host registry..." -ForegroundColor Yellow
$nativeHostPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"

try {
    $registryValue = Get-ItemProperty -Path $nativeHostPath -ErrorAction Stop
    Write-Host "   OK Native Host registry ton tai" -ForegroundColor Green
    Write-Host "   Path: $($registryValue.'(default)')" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR Native Host registry khong ton tai" -ForegroundColor Red
    Write-Host "   Chay lai: .\install-native-host.ps1" -ForegroundColor Cyan
}

# 3. Kiểm tra manifest file
Write-Host "`n3. Kiem tra manifest file..." -ForegroundColor Yellow
$manifestFile = ".\native-host\com.zalocrawler.host.json"

if (Test-Path $manifestFile) {
    try {
        $manifest = Get-Content $manifestFile -Raw | ConvertFrom-Json
        Write-Host "   OK Manifest file hop le" -ForegroundColor Green
        Write-Host "   Host path: $($manifest.path)" -ForegroundColor Gray
        
        # Kiểm tra host file có tồn tại không
        if (Test-Path $manifest.path) {
            Write-Host "   OK Host file ton tai" -ForegroundColor Green
        } else {
            Write-Host "   ERROR Host file khong ton tai: $($manifest.path)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ERROR Manifest file khong hop le" -ForegroundColor Red
    }
} else {
    Write-Host "   ERROR Manifest file khong ton tai" -ForegroundColor Red
}

# 4. Restart Chrome processes
Write-Host "`n4. Restart Chrome processes..." -ForegroundColor Yellow
try {
    $chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
    if ($chromeProcesses) {
        Write-Host "   WARNING Tim thay $($chromeProcesses.Count) Chrome process(es)" -ForegroundColor Yellow
        Write-Host "   Vui long dong tat ca Chrome windows va thu lai" -ForegroundColor Cyan
    } else {
        Write-Host "   OK Khong co Chrome process nao dang chay" -ForegroundColor Green
    }
} catch {
    Write-Host "   INFO Khong the kiem tra Chrome processes" -ForegroundColor Gray
}

Write-Host "`nHUONG DAN KHAC PHUC:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

Write-Host "`nCach 1 - Reset file association (Recommended):" -ForegroundColor Yellow
Write-Host "1. Nhan Win + R, go 'ms-settings:defaultapps'" -ForegroundColor White
Write-Host "2. Cuon xuong tim 'Choose default apps by file type'" -ForegroundColor White
Write-Host "3. Tim '.js' trong danh sach" -ForegroundColor White
Write-Host "4. Click vao ung dung hien tai (VS Code)" -ForegroundColor White
Write-Host "5. Chon 'Choose another app' -> 'More apps'" -ForegroundColor White
Write-Host "6. Chon 'Look for another app on this PC'" -ForegroundColor White
Write-Host "7. Navigate den: C:\Windows\System32\cmd.exe" -ForegroundColor White

Write-Host "`nCach 2 - Sua truc tiep trong Registry:" -ForegroundColor Yellow
Write-Host "1. Nhan Win + R, go 'regedit'" -ForegroundColor White
Write-Host "2. Navigate den: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.js" -ForegroundColor White
Write-Host "3. Xoa key 'UserChoice' (neu co)" -ForegroundColor White
Write-Host "4. Restart Chrome" -ForegroundColor White

Write-Host "`nCach 3 - Sua manifest path:" -ForegroundColor Yellow
Write-Host "1. Sua file: .\native-host\com.zalocrawler.host.json" -ForegroundColor White
Write-Host "2. Thay 'path' thanh: 'node'" -ForegroundColor White
Write-Host "3. Them 'args': ['D:/VS Code/Zalo-Craw---ChromeExtension/native-host/host.js']" -ForegroundColor White
Write-Host "4. Chay lai: .\install-native-host.ps1" -ForegroundColor White

Write-Host "`nSau khi khac phuc:" -ForegroundColor Cyan
Write-Host "1. Dong tat ca Chrome windows" -ForegroundColor White
Write-Host "2. Mo lai Chrome" -ForegroundColor White
Write-Host "3. Thu lai 'Test Ket Noi'" -ForegroundColor White 