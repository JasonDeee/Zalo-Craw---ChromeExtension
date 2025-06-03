const SampleSchema2 = [
  {
    sender: "Nguyen Van A",
    message1: {
      type: "text",
      content: "Hello",
    },
    message2: {
      type: "image",
      content_sample: [
        {
          id: "img-1748913434621.3134982196889778592.g3002843645600913037-MESSAGE_LIST_GROUP_PHOTO",
          Preview_url:
            "blob:https://chat.zalo.me/7522e953-8e89-4340-9f90-25b42bd8f07f",
        },
        // ...
      ],
    },
    message3: {
      type: "text",
      content: "Hello",
    },
    message4: {
      type: "text",
      content: "Hello",
    },
  },
];

const NewMessageSchema = [
  {
    sender: "Nguyen Van A",
    messages: [
      {
        type: "text",
        content: "Hello",
      },
      {
        type: "image",
        content: [
          {
            id: "img-1748913434621.3134982196889778592.g3002843645600913037-MESSAGE_LIST_GROUP_PHOTO",
            preview_url:
              "blob:https://chat.zalo.me/7522e953-8e89-4340-9f90-25b42bd8f07f",
          },
        ],
      },
    ],
  },
  {
    sender: "Le Van B",
    messages: [
      {
        type: "text",
        content: "Hello",
      },
      {
        type: "image",
        content: [
          {
            id: "img-1748913434621.3134982196889778592.g3002843645600913037-MESSAGE_LIST_GROUP_PHOTO",
            preview_url:
              "blob:https://chat.zalo.me/7522e953-8e89-4340-9f90-25b42bd8f07f",
          },
        ],
      },
      {
        type: "text",
        content: "Hello",
      },
      {
        type: "text",
        content: "Hello",
      },
    ],
  },
];

document.addEventListener("DOMContentLoaded", function () {
  const startCrawlButton = document.getElementById("startCrawl");
  const resultElement = document.getElementById("result");
  const statusElement = document.getElementById("status");
  const copyDataButton = document.getElementById("copyData");
  const messageTableElement = document.getElementById("messageTable");

  // Schema mẫu để lưu trữ dữ liệu
  const messageSchema = {
    conversations: [],
  };

  // Sự kiện click nút bắt đầu crawl
  startCrawlButton.addEventListener("click", function () {
    resultElement.textContent = "Đang crawl dữ liệu...";
    statusElement.style.display = "block";
    statusElement.textContent = "Đang crawl dữ liệu từ Zalo...";
    statusElement.style.backgroundColor = "#fff8e1";
    statusElement.style.color = "#f57c00";

    // Gửi message tới content script để crawl dữ liệu từ trang hiện tại
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        // Tìm tất cả các block-date có class Vx_CrawlerTarget
        const targetBlocks = document.querySelectorAll('.block-date.Vx_CrawlerTarget');
        
        // Mảng kết quả
        const conversations = [];
        
        // Duyệt qua từng block
        targetBlocks.forEach(block => {
          // Tìm tất cả chat-item trong block
          const chatItems = Array.from(block.querySelectorAll('.chat-item'));
          
          // Biến để theo dõi khối tin nhắn hiện tại
          let currentMessageGroup = null;
          
          // Duyệt qua từng chat-item
          chatItems.forEach(chatItem => {
            // Kiểm tra xem chat-item có zavatar-container không
            const hasAvatar = chatItem.querySelector('.zavatar-container') !== null;
            
            if (hasAvatar) {
              // Nếu có avatar, đây là tin nhắn đầu tiên của một người gửi mới
              // Lấy thông tin người gửi
              let sender = "";
              const senderElement = chatItem.querySelector('.message-sender-name-content .truncate');
              if (senderElement) {
                sender = senderElement.textContent.trim();
              }
              
              // Tạo nhóm tin nhắn mới
              currentMessageGroup = {
                sender: sender,
                messages: []
              };
              
              // Thêm vào mảng kết quả
              conversations.push(currentMessageGroup);
            }
            
            // Nếu chưa có nhóm tin nhắn nào, tạo một nhóm mới với người gửi không xác định
            if (!currentMessageGroup) {
              currentMessageGroup = {
                sender: "Unknown",
                messages: []
              };
              conversations.push(currentMessageGroup);
            }
            
            // Xử lý tin nhắn trong chat-item hiện tại
            // Tìm tin nhắn văn bản
            const textMessages = chatItem.querySelectorAll('.text-message__container .text');
            textMessages.forEach(textMsg => {
              currentMessageGroup.messages.push({
                type: "text",
                content: textMsg.textContent.trim()
              });
            });
            
            // Tìm tin nhắn đã thu hồi
            const undoMessages = chatItem.querySelectorAll('.undo-message');
            undoMessages.forEach(undoMsg => {
              currentMessageGroup.messages.push({
                type: "recall",
                content: undoMsg.textContent.trim()
              });
            });
            
            // Tìm tin nhắn hình ảnh
            const imageMessages = chatItem.querySelectorAll('.card--group-photo .zimg-el');
            if (imageMessages.length > 0) {
              const imageContent = [];
              
              imageMessages.forEach(img => {
                imageContent.push({
                  id: img.id,
                  preview_url: img.src
                });
              });
              
              if (imageContent.length > 0) {
                currentMessageGroup.messages.push({
                  type: "image",
                  content: imageContent
                });
              }
            }
          });
        });
        
        // Lọc bỏ các nhóm tin nhắn không có tin nhắn nào
        return conversations.filter(group => group.messages.length > 0);
      })();
    `,
      (result, isException) => {
        if (isException) {
          console.error("Error executing script", isException);
          resultElement.textContent =
            "Lỗi khi crawl dữ liệu: " + isException.value;
          statusElement.textContent =
            "Lỗi khi crawl dữ liệu: " + isException.value;
          statusElement.style.backgroundColor = "#ffebee";
          statusElement.style.color = "#d32f2f";
          return;
        }

        if (result && Array.isArray(result)) {
          messageSchema.conversations = result;

          // Hiển thị số lượng tin nhắn đã crawl được
          const countMessage = `Đã crawl được ${result.length} nhóm tin nhắn.`;
          statusElement.textContent = countMessage;
          statusElement.style.backgroundColor = "#e8f5e9";
          statusElement.style.color = "#388e3c";

          // Hiển thị dữ liệu dưới dạng JSON
          displayJsonData(messageSchema);

          // Hiển thị dữ liệu dưới dạng bảng
          displayTableData(messageSchema.conversations);

          console.log("Crawled data:", messageSchema);

          // Lưu dữ liệu vào localStorage để có thể sử dụng sau này
          try {
            chrome.storage.local.set(
              { zaloMessages: messageSchema },
              function () {
                console.log("Dữ liệu đã được lưu vào storage");
              }
            );
          } catch (error) {
            console.error("Không thể lưu dữ liệu vào storage:", error);
          }
        } else {
          resultElement.textContent = "Không tìm thấy dữ liệu phù hợp.";
          statusElement.textContent = "Không tìm thấy dữ liệu phù hợp.";
          statusElement.style.backgroundColor = "#fff8e1";
          statusElement.style.color = "#f57c00";
        }
      }
    );
  });

  // Sự kiện click nút sao chép dữ liệu
  copyDataButton.addEventListener("click", function () {
    const jsonString = JSON.stringify(messageSchema, null, 2);
    navigator.clipboard.writeText(jsonString).then(
      function () {
        statusElement.style.display = "block";
        statusElement.textContent = "Đã sao chép dữ liệu vào clipboard!";
        statusElement.style.backgroundColor = "#e8f5e9";
        statusElement.style.color = "#388e3c";
        setTimeout(function () {
          statusElement.style.display = "none";
        }, 3000);
      },
      function (err) {
        statusElement.style.display = "block";
        statusElement.textContent = "Không thể sao chép dữ liệu: " + err;
        statusElement.style.backgroundColor = "#ffebee";
        statusElement.style.color = "#d32f2f";
      }
    );
  });

  // Xử lý chuyển đổi tab
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      // Xóa class active từ tất cả các tab
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Thêm class active cho tab được chọn
      this.classList.add("active");
      document.getElementById(tabId + "View").classList.add("active");
    });
  });

  // Hàm hiển thị dữ liệu dưới dạng JSON
  function displayJsonData(data) {
    // Chuyển đổi JSON thành chuỗi có định dạng đẹp
    const jsonString = JSON.stringify(data, null, 2);

    // Tạo phần tử pre để hiển thị JSON có định dạng
    const preElement = document.createElement("pre");
    preElement.style.backgroundColor = "#f5f5f5";
    preElement.style.padding = "10px";
    preElement.style.borderRadius = "5px";
    preElement.style.overflowX = "auto";
    preElement.style.maxHeight = "500px";
    preElement.textContent = jsonString;

    // Xóa nội dung cũ và thêm nội dung mới vào resultElement
    resultElement.textContent = "";
    resultElement.appendChild(preElement);
  }

  // Hàm hiển thị dữ liệu dưới dạng bảng
  function displayTableData(conversations) {
    // Xóa nội dung cũ
    messageTableElement.innerHTML = "";

    // Tạo bảng
    const table = document.createElement("table");
    table.className = "message-table";

    // Duyệt qua từng nhóm tin nhắn
    conversations.forEach((group, index) => {
      // Tạo nhóm tin nhắn
      const messageGroup = document.createElement("tbody");
      messageGroup.className = "message-group";

      // Tạo hàng hiển thị người gửi
      const senderRow = document.createElement("tr");
      senderRow.className = "sender-row";

      const senderCell = document.createElement("td");
      senderCell.className = "sender-cell";
      senderCell.colSpan = 2;
      senderCell.textContent = group.sender || "Unknown";

      senderRow.appendChild(senderCell);
      messageGroup.appendChild(senderRow);

      // Duyệt qua từng tin nhắn trong nhóm
      group.messages.forEach((message) => {
        const messageRow = document.createElement("tr");
        messageRow.className = "message-row";

        const typeCell = document.createElement("td");
        typeCell.className = "message-type";
        typeCell.textContent = message.type;

        const contentCell = document.createElement("td");
        contentCell.className = "message-content";

        // Hiển thị nội dung tin nhắn tùy theo loại
        if (message.type === "text" || message.type === "recall") {
          contentCell.textContent = message.content;
          if (message.type === "recall") {
            contentCell.classList.add("recall-message");
          }
        } else if (message.type === "image") {
          const imageGrid = document.createElement("div");
          imageGrid.className = "image-grid";

          message.content.forEach((img) => {
            const imageItem = document.createElement("div");
            imageItem.className = "image-item";

            const image = document.createElement("img");
            image.className = "image-preview";
            image.src = img.preview_url;
            image.alt = "Image";

            const imageId = document.createElement("div");
            imageId.className = "image-id";
            imageId.textContent = img.id;

            imageItem.appendChild(image);
            imageItem.appendChild(imageId);
            imageGrid.appendChild(imageItem);
          });

          contentCell.appendChild(imageGrid);
        }

        messageRow.appendChild(typeCell);
        messageRow.appendChild(contentCell);
        messageGroup.appendChild(messageRow);
      });

      table.appendChild(messageGroup);
    });

    messageTableElement.appendChild(table);
  }
});
