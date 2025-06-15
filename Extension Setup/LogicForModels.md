# 🎯 ZALO CRAWLER - LOGIC & MODELS GUIDE

## Context dự án (Giúp tôi mô tả context để các AI chat khác có thể hiểu bối cảnh của dự án này)

### 🎯 **TỔNG QUAN DỰ ÁN**

**Zalo Crawler** là một Chrome Extension được thiết kế để thu thập dữ liệu khách hàng từ Zalo Web một cách tự động và có tổ chức. Dự án này phục vụ cho việc quản lý thông tin khách hàng trong môi trường kinh doanh.

### 🏢 **BỐI CẢNH SỬ DỤNG**

- **Đối tượng sử dụng**: Nhân viên kinh doanh, quản lý khách hàng, team marketing
- **Môi trường**: Zalo Web (chat.zalo.me) - nền tảng nhắn tin phổ biến tại Việt Nam
- **Mục đích**: Tự động hóa việc thu thập và tổ chức thông tin khách hàng từ cuộc trò chuyện

### 📊 **ĐỊNH NGHĨA DỮ LIỆU**

**Khách hàng (Client)** trong hệ thống được định nghĩa bởi 2 thành phần chính:

1. **Text (Tên/Thông tin khách hàng)**:

   - Chứa tên khách hàng hoặc thông tin định danh
   - Nguồn: Tin nhắn văn bản trong cuộc trò chuyện
   - Lưu ý: Không phải tất cả tin nhắn text đều là tên khách hàng, có thể là thông tin bổ sung

2. **Images (Hình ảnh khách hàng)**:
   - Chứa ảnh chân dung, ảnh sản phẩm, hoặc tài liệu liên quan đến khách hàng
   - Nguồn: Hình ảnh được gửi trong cuộc trò chuyện
   - Giả định: 95% hình ảnh trong chat là của khách hàng (rất hiếm khi là hình ảnh khác)

### 🔄 **QUY TRÌNH HOẠT ĐỘNG**

1. **Crawling**: Thu thập raw data từ Zalo Web DOM
2. **Processing**: Xử lý và đơn giản hóa các loại tin nhắn
3. **Validation**: Kiểm tra tính hợp lệ theo business rules
4. **Conversion**: Chuyển đổi sang format khách hàng cuối cùng
5. **Export**: Xuất dữ liệu JSON hoặc tải hình ảnh

### 🎨 **KIẾN TRÚC HỆ THỐNG**

- **Chrome Extension**: DevTools Panel với UI quản lý dữ liệu
- **Content Script**: Tương tác với Zalo Web DOM
- **Background Script**: Xử lý download và native messaging
- **Data Schemas**: Cấu trúc dữ liệu từ raw → processed → client format

### 🚀 **TÍNH NĂNG CHÍNH**

- **Auto Crawling**: Tự động thu thập tin nhắn từ các block được đánh dấu
- **Data Classification**: Phân loại dữ liệu hợp lệ/lỗi theo business rules
- **Manual Editing**: Chỉnh sửa thủ công dữ liệu lỗi (xóa, di chuyển, sửa đổi)
- **Batch Download**: Tải hàng loạt hình ảnh với tên file có tổ chức
- **Export Options**: Xuất JSON, copy clipboard, hoặc gửi đến Electron app

### 📋 **BUSINESS RULES**

- **Pairing Logic**: Mỗi khách hàng = 1 text + 1 image (hoặc nhiều images)
- **Even Messages**: Chỉ chấp nhận số lượng tin nhắn chẵn trong mỗi conversation
- **No Recalled**: Tin nhắn thu hồi được loại bỏ hoàn toàn
- **Quote Simplification**: Tin nhắn trích dẫn chỉ lấy phần reply chính

## 📋 **MỤC ĐÍCH DỰ ÁN**

Thu thập dữ liệu khách hàng từ Zalo Web:

- **Input**: Tin nhắn chat trên Zalo Web
- **Output**: JSON chứa tên khách hàng + hình ảnh khách hàng

## 🏗️ **CẤU TRÚC DỮ LIỆU ĐÍCH**

```json
{
  "clients": [
    {
      "text": "Tên khách hàng",
      "images": [
        {
          "id": "img-xxx-MESSAGE_LIST",
          "preview_url": "blob:https://chat.zalo.me/xxx"
        }
      ],
      "error": false
    }
  ]
}
```

## 🔍 **CÁC LOẠI TIN NHẮN ĐƯỢC HỖ TRỢ**

### **1. Message Types (Raw)**

- **Text messages**: `.text-message__container .text`
- **Group photos**: `.card--group-photo .zimg-el`
- **Single images**: `.chatImageMessage--audit .zimg-el, .img-msg-v2 .zimg-el`
- **Image captions**: `.img-msg-v2__cap .text`
- **Quoted messages**: `.message-quote-fragment__container + main text`
- **Recalled messages**: `.undo-message` (text: "Tin nhắn đã được thu hồi")

### **2. Simplified Types (After Processing)**

- **Text**: Tên khách hàng hoặc thông tin văn bản
- **Images**: Array hình ảnh khách hàng

## ⚙️ **QUY TRÌNH XỬ LÝ**

### **Step 1: Crawling**

```javascript
// Tìm target blocks
.querySelectorAll('.block-date.Vx_CrawlerTarget')

// Nhóm theo sender (có zavatar-container)
{
  "sender": "Tên người gửi",
  "messages": [
    {"type": "text", "content": "..."},
    {"type": "image", "content": [...]}
  ]
}
```

### **Step 2: Message Type Simplification**

- `text` → `text` (giữ nguyên)
- `image` → `image` (giữ nguyên)
- `quote_text`, `quote_image` → `text` (chỉ lấy main reply text)
- `recalled` → **XÓA KHỎI DỮ LIỆU**

### **Step 3: Filtering**

1. **Loại bỏ recalled messages** trước
2. **Xóa sender** nếu không còn tin nhắn nào
3. **Đếm số lượng messages** còn lại

### **Step 4: Validation Rules**

```
✅ VALID PATTERNS:
- Chẵn messages: Mỗi cặp phải có 1 text + 1 image
- Lẻ messages: ❌ LOẠI TẤT CẢ

❌ INVALID PATTERNS:
- Số lượng lẻ
- Cặp cùng type (text+text hoặc image+image)
- Sender không có tin nhắn (sau khi lọc recalled)
```

## 🔄 **CONVERSION LOGIC**

```javascript
// Xử lý từng cặp tin nhắn (i, i+1)
for (let i = 0; i < messages.length; i += 2) {
  const pair = [messages[i], messages[i + 1]];

  // Tạo client object
  const client = {
    text: "", // Từ message type "text"
    images: [], // Từ message type "image"
    error: false,
  };
}
```

## 🚨 **LƯU Ý QUAN TRỌNG**

### **Recalled Messages**

- **Selector**: `.undo-message` với text "Tin nhắn đã được thu hồi"
- **Xử lý**: XÓA hoàn toàn khỏi dữ liệu trước khi validate
- **Impact**: Có thể làm thay đổi số lượng messages từ chẵn → lẻ

### **Quoted Messages**

- **Chỉ lấy main reply text**, bỏ qua quoted content
- **Pattern**: 1 quote + 1 reply = 2 messages → 1 text
- **Không có images** để download từ quoted content

### **Error Handling**

- **Same type pairs**: text+text hoặc image+image → `error: true`
- **Empty senders**: Xóa khỏi conversations array
- **Invalid patterns**: Đưa vào errorMessageSchema

## 📊 **PATTERNS SUMMARY**

| Input Pattern | After Simplify | Validation   | Output    |
| ------------- | -------------- | ------------ | --------- |
| Text+Image    | text+image     | ✅ Valid     | 1 client  |
| Image+Text    | image+text     | ✅ Valid     | 1 client  |
| Quote+Reply   | text           | ❌ Lẻ        | Error     |
| Single Text   | text           | ❌ Lẻ        | Error     |
| Single Image  | image          | ❌ Lẻ        | Error     |
| Text+Text     | text+text      | ❌ Same type | Error     |
| Recalled      | _deleted_      | -            | No output |

## 🛠️ **KEY FUNCTIONS**

- `classifyData()`: Phân loại valid/error sau khi lọc recalled
- `convertData()`: Chuyển đổi sang client format
- `checkChatData()`: Validate theo rules
- `downloadAllImages()`: Tải hình ảnh từ converted data
