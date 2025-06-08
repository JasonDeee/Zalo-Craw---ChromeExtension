# Script để cập nhật Extension ID trong Native Host Manifest
param(
    [Parameter(Mandatory=$true)]
    [string]$ExtensionId
)

Write-Host "🔧 Cập nhật Extension ID trong Native Host Manifest..." -ForegroundColor Cyan

# Đường dẫn tới manifest file
$manifestPath = ".\native-host\com.zalocrawler.host.json"

if (-not (Test-Path $manifestPath)) {
    Write-Host "❌ Không tìm thấy file manifest: $manifestPath" -ForegroundColor Red
    exit 1
}

try {
    # Đọc manifest hiện tại
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    # Cập nhật allowed_origins
    $manifest.allowed_origins = @("chrome-extension://$ExtensionId/")
    
    # Ghi lại file
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding UTF8
    
    Write-Host "✅ Đã cập nhật Extension ID: $ExtensionId" -ForegroundColor Green
    Write-Host "📁 File đã cập nhật: $manifestPath" -ForegroundColor Yellow
    
    # Hiển thị nội dung đã cập nhật
    Write-Host "`n📋 Nội dung manifest đã cập nhật:" -ForegroundColor Cyan
    Get-Content $manifestPath | Write-Host -ForegroundColor Gray
    
    Write-Host "`n📝 Bước tiếp theo:" -ForegroundColor Cyan
    Write-Host "1. Chạy: .\install-native-host.ps1" -ForegroundColor White
    Write-Host "2. Restart Chrome" -ForegroundColor White
    Write-Host "3. Test Native Messaging" -ForegroundColor White
    
} catch {
    Write-Host "❌ Lỗi khi cập nhật manifest: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Hướng dẫn lấy Extension ID:" -ForegroundColor Cyan
Write-Host "1. Mở Chrome và vào chrome://extensions/" -ForegroundColor White
Write-Host "2. Bật Developer mode" -ForegroundColor White
Write-Host "3. Load extension từ thư mục 'Extension Setup'" -ForegroundColor White
Write-Host "4. Copy Extension ID và chạy lại script này" -ForegroundColor White 