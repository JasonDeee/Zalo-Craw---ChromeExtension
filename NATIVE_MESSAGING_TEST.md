# 🔗 Native Messaging Test Guide

Hướng dẫn test khả năng giao tiếp giữa Chrome Extension và Electron App Zalo Crawler - Chế độ độc lập
−
□
×
Chế độ độc lập - Standalone Mode
Zalo Image Organizer
Đường dẫn thư mục chứa hình ảnh:
Nhập đường dẫn thư mục chứa hình ảnh...
Chọn thư mục
Dữ liệu JSON (từ extension):
Dán dữ liệu JSON từ extension vào đây. Ví dụ:
{
"clients": [
{
"text": "Tên khách hàng 1",
"image_names": ["image1.jpg", "image2.jpg"]
},
{
"text": "Tên khách hàng 2",
"image_names": ["image3.jpg"]
}
]
}
Xử lý và tổ chức hình ảnh
← Quay lại Welcome
⚙️ Cài đặt
Zalo Crawler - Chế độ độc lập
−
□
×
Chế độ độc lập - Standalone Mode
Zalo Image Organizer
Đường dẫn thư mục chứa hình ảnh:
Nhập đường dẫn thư mục chứa hình ảnh...
Chọn thư mục
Dữ liệu JSON (từ extension):
Dán dữ liệu JSON từ extension vào đây. Ví dụ:
{
"clients": [
{
"text": "Tên khách hàng 1",
"image_names": ["image1.jpg", "image2.jpg"]
},
{
"text": "Tên khách hàng 2",
"image_names": ["image3.jpg"]
}
]
}
Xử lý và tổ chức hình ảnh
← Quay lại Welcome
⚙️ Cài đặt
−
□
×
Z
Zalo
Crawler
[Ohio Ver]
Extension Token
MLnbdvsdf
Chưa xác thực

🚀
Chế độ kết nối

Chế độ độc lập

- Chế độ độc lập: Mọi chức năng hoạt động bình thường.
  Người dùng cần sao chép JSON thủ công từ Phần mở rộng
  của Zalo Crawler trong trình duyệt.

💻
Thiết lập
Desktop MB5430
⚙️ Cài đặt
ℹ️ Giới thiệu
thông qua Native Messaging.

## 📋 Chuẩn bị

### 1. Cài đặt Native Host

```powershell
# Chạy PowerShell với quyền Administrator
.\install-native-host.ps1
```

### 2. Test Native Host

```bash
# Test xem native host có hoạt động không
node test-native-messaging.js
```

### 3. Load Extension vào Chrome

1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked" và chọn thư mục `Extension Setup`
4. Ghi nhớ Extension ID (ví dụ: `aodepfcnhkokkgiohcgfclldcfbcfaoo`)

### 4. Cập nhật Extension ID trong manifest

Nếu Extension ID khác với ID mặc định, cập nhật file `native-host/com.zalocrawler.host.json`:

```json
{
  "allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID_HERE/"]
}
```

## 🧪 Quy trình Test

### Bước 1: Khởi động Electron App

```bash
npm start
```

### Bước 2: Mở Zalo Web

1. Mở Chrome và vào https://chat.zalo.me
2. Đăng nhập vào tài khoản Zalo
3. Kiểm tra xem có nút "🔗 Test Electron" ở góc dưới bên phải không

### Bước 3: Test giao tiếp từ Extension → Electron

1. Click nút "🔗 Test Electron" trên trang Zalo
2. Nút sẽ chuyển thành "📤 Đang gửi..."
3. Nếu thành công: nút sẽ hiển thị "✅ Đã gửi!"
4. Nếu thất bại: nút sẽ hiển thị "❌ Lỗi!"

### Bước 4: Kiểm tra Electron App

1. Trong Electron App, click nút "Chế độ kết nối" từ Welcome screen
2. Màn hình PairedMode sẽ hiển thị:
   - Trạng thái kết nối
   - Tin nhắn nhận được từ Extension
   - Số lượng tin nhắn đã nhận

### Bước 5: Test giao tiếp từ Electron → Extension

1. Trong PairedMode, click nút "Test Kết Nối"
2. Kiểm tra console của Extension để xem có nhận được tin nhắn không

## 🔍 Debug

### Kiểm tra Console Logs

**Chrome Extension Console:**

1. Vào `chrome://extensions/`
2. Click "Inspect views: background page" cho Zalo Crawler extension
3. Xem console logs

**Content Script Console:**

1. Mở Developer Tools trên trang Zalo (F12)
2. Xem console logs

**Electron Console:**

1. Mở Developer Tools trong Electron App (Ctrl+Shift+I)
2. Xem console logs

### Các lỗi thường gặp

**1. "Native host not found"**

- Chạy lại `install-native-host.ps1`
- Restart Chrome
- Kiểm tra đường dẫn trong manifest

**2. "Extension ID mismatch"**

- Cập nhật `allowed_origins` trong manifest với Extension ID đúng
- Chạy lại install script

**3. "Connection refused"**

- Kiểm tra Electron App có đang chạy không
- Kiểm tra native host process có được spawn không

**4. Nút test không xuất hiện**

- Kiểm tra content script có được load không
- Kiểm tra URL có match với `https://chat.zalo.me/*` không

## 📊 Kết quả mong đợi

### Khi test thành công:

1. ✅ Nút test xuất hiện trên trang Zalo
2. ✅ Click nút → hiển thị "Đã gửi!"
3. ✅ PairedMode nhận được tin nhắn từ Extension
4. ✅ Trạng thái kết nối hiển thị "Đã kết nối"
5. ✅ Console logs hiển thị tin nhắn được gửi/nhận

### Luồng dữ liệu:

```
Extension Content Script → Background Script → Native Host → Electron Main → Renderer (PairedMode)
```

## 🛠️ Troubleshooting

### Reset toàn bộ setup:

1. Unload extension từ Chrome
2. Chạy lại `install-native-host.ps1`
3. Restart Chrome
4. Load lại extension
5. Restart Electron App

### Kiểm tra registry (Windows):

```cmd
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"
```

### Test manual native host:

```bash
# Test trực tiếp native host
node native-host/host.js
```

## 📝 Notes

- Native Messaging chỉ hoạt động khi cả Extension và Electron App đều đang chạy
- Mỗi lần thay đổi manifest cần restart Chrome
- Extension ID sẽ thay đổi nếu reload extension ở developer mode
- Đảm bảo Node.js đã được cài đặt và có trong PATH
