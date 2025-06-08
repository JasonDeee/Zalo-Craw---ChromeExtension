# 🧪 Hướng dẫn Test Native Messaging - Zalo Crawler

## 📋 **Bước 1: Chuẩn bị Extension**

### 1.1. Load Extension vào Chrome

```bash
1. Mở Chrome và vào chrome://extensions/
2. Bật "Developer mode" (góc trên bên phải)
3. Click "Load unpacked"
4. Chọn thư mục "Extension Setup"
5. Ghi nhớ Extension ID (ví dụ: aodepfcnhkokkgiohcgfclldcfbcfaoo)
```

### 1.2. Cập nhật Extension ID trong Native Host

```json
// File: native-host/com.zalocrawler.host.json
{
  "name": "com.zalocrawler.host",
  "description": "Native messaging host for Zalo Crawler",
  "path": "D:/VS Code/Zalo-Craw---ChromeExtension/native-host/host.js",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID_HERE/"]
}
```

**Thay `YOUR_EXTENSION_ID_HERE` bằng Extension ID thực tế từ Chrome**

## 📋 **Bước 2: Cài đặt Native Host**

### 2.1. Chạy Install Script

```powershell
# Mở PowerShell với quyền Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-native-host.ps1
```

### 2.2. Kiểm tra Registry

```cmd
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"
```

## 📋 **Bước 3: Test Setup**

### 3.1. Test Native Host

```bash
node test-native-messaging.js
```

**Kết quả mong đợi:**

```
🧪 Testing Native Messaging Setup...

1. Checking native host file...
✅ Native host file exists: D:\VS Code\Zalo-Craw---ChromeExtension\native-host\host.js

2. Checking manifest file...
✅ Manifest file exists: D:\VS Code\Zalo-Craw---ChromeExtension\native-host\com.zalocrawler.host.json
✅ Manifest is valid JSON

3. Testing native host execution...
✅ Native host started successfully

4. Checking Windows registry...
✅ Native host registered in Chrome registry
```

## 📋 **Bước 4: Test End-to-End**

### 4.1. Khởi động Electron App

```bash
npm start
```

### 4.2. Test từ Extension Panel

**Cách 1: Từ Extension Popup**

1. Click vào icon Extension trên toolbar Chrome
2. Click nút "🔗 Test Electron"
3. Kiểm tra status: "✅ Đã gửi!" hoặc "❌ Lỗi!"

**Cách 2: Từ Native Messaging Tab**

1. Click vào icon Extension trên toolbar Chrome
2. Chuyển sang tab "🔗 Native Messaging"
3. Click "Test Kết Nối"
4. Xem log messages và connection status

### 4.3. Test từ Zalo Web Page

1. Mở https://chat.zalo.me và đăng nhập
2. Tìm nút "🔗 Test Electron" ở góc dưới bên phải
3. Click nút và xem phản hồi

### 4.4. Kiểm tra Electron App

1. Trong Electron App, click "Chế độ kết nối"
2. Màn hình PairedMode sẽ hiển thị:
   - Trạng thái kết nối: "Đã kết nối"
   - Tin nhắn từ Extension
   - Số tin nhắn đã nhận

## 🔍 **Debug và Troubleshooting**

### Console Logs để kiểm tra:

**Chrome Extension Console:**

```bash
1. Vào chrome://extensions/
2. Click "Inspect views: background page" cho Zalo Crawler
3. Xem console logs
```

**Content Script Console:**

```bash
1. Mở Developer Tools trên trang Zalo (F12)
2. Xem console logs
```

**Electron Console:**

```bash
1. Mở Developer Tools trong Electron App (Ctrl+Shift+I)
2. Xem console logs
```

### Các lỗi thường gặp:

**1. "Native host not found"**

```bash
Giải pháp:
- Kiểm tra đường dẫn trong manifest
- Chạy lại install-native-host.ps1
- Restart Chrome
```

**2. "Extension ID mismatch"**

```bash
Giải pháp:
- Cập nhật allowed_origins trong manifest với Extension ID đúng
- Chạy lại install script
```

**3. "Connection refused"**

```bash
Giải pháp:
- Kiểm tra Electron App có đang chạy không
- Kiểm tra native host process có được spawn không
- Xem console logs để debug
```

**4. Nút test không xuất hiện**

```bash
Giải pháp:
- Kiểm tra content script có được load không
- Kiểm tra URL có match với https://chat.zalo.me/* không
- Reload extension và refresh trang
```

## ✅ **Checklist Test thành công**

- [ ] Extension loaded thành công trong Chrome
- [ ] Extension ID đã được cập nhật trong native host manifest
- [ ] Native host đã được register trong Windows registry
- [ ] test-native-messaging.js chạy thành công
- [ ] Electron App khởi động được
- [ ] Nút "🔗 Test Electron" xuất hiện trong Extension popup
- [ ] Tab "🔗 Native Messaging" hoạt động trong Extension
- [ ] Nút floating xuất hiện trên trang Zalo
- [ ] PairedMode trong Electron nhận được tin nhắn từ Extension
- [ ] Console logs hiển thị tin nhắn được gửi/nhận thành công

## 🎯 **Kết quả mong đợi khi test thành công:**

1. **Extension → Electron:** ✅

   - Click nút trong Extension → Tin nhắn xuất hiện trong PairedMode

2. **Zalo Page → Electron:** ✅

   - Click nút floating → Tin nhắn xuất hiện trong PairedMode

3. **Electron → Extension:** ✅

   - Click "Test Kết Nối" trong PairedMode → Console Extension nhận được tin nhắn

4. **Bidirectional Communication:** ✅
   - Tin nhắn có thể gửi qua lại giữa Extension và Electron

## 📞 **Liên hệ khi gặp vấn đề:**

Nếu gặp lỗi, hãy cung cấp:

1. Extension ID từ Chrome
2. Console logs từ Extension background page
3. Console logs từ Electron App
4. Output của test-native-messaging.js
5. Screenshot của error messages
