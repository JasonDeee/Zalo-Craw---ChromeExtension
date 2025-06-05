@echo off
echo Khởi động Chrome với cổng debug 9222...
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="D:\ChromeDebugProfile"
echo Chrome đã được khởi động với cổng debug 9222.
echo Bạn có thể chạy ứng dụng Electron để kết nối ngay bây giờ.
pause