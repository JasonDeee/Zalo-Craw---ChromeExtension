// Biến để lưu trữ thông tin tải xuống
let downloadQueue = [];
let processedDownloads = new Set(); // Lưu trữ ID tải xuống đã xử lý
let currentClientText = "";

const convertedSchema = {
  clients: [
    {
      text: "Hello", // Text này có thể là tên khách hàng
      images: [
        {
          id: "img-1748913434621.3134982196889778592.g3002843645600913037-MESSAGE_LIST_GROUP_PHOTO",
          preview_url:
            "blob:https://chat.zalo.me/7522e953-8e89-4340-9f90-25b42bd8f07f",
        },
      ],
      error: false,
    },
  ],
};
const ImageListSchema = [
  {
    text: "Tên khách hàng",
    image_names: ["image_1.jpg", "image_2.jpg", "image_3.jpg"],
  },
  {
    text: "Tên khách hàng",
    image_names: ["image_1.jpg", "image_2.jpg", "image_3.jpg"],
  },
];

// Schema để lưu trữ thông tin tải xuống thực tế
const DownloadedImageSchema = {
  clients: [],
};

// Biến để lưu trữ dữ liệu hiện đang được hiển thị trong tab JSON
let currentDisplayedJsonData = null;

document.addEventListener("DOMContentLoaded", function () {
  const startCrawlButton = document.getElementById("startCrawl");
  const resultElement = document.getElementById("result");
  const statusElement = document.getElementById("status");
  const copyDataButton = document.getElementById("copyData");
  const checkDataButton = document.getElementById("checkData");
  const convertDataButton = document.getElementById("convertData");
  const getAllImagesButton = document.getElementById("getAllImages");
  const testElectronButton = document.getElementById("testElectron");
  const messageTableElement = document.getElementById("messageTable");
  const errorMessageTableElement = document.getElementById("errorMessageTable");
  const downloadsTableElement = document.getElementById("downloadsTable");
  const exportDownloadsButton = document.getElementById("exportDownloads");

  // Schema mẫu để lưu trữ dữ liệu hợp lệ
  const messageSchema = {
    conversations: [],
  };

  // Schema mẫu để lưu trữ dữ liệu không hợp lệ
  const errorMessageSchema = {
    conversations: [],
  };

  // Schema mẫu để lưu trữ dữ liệu đã chuyển đổi
  const convertedDataSchema = {
    clients: [],
  };

  // Sự kiện click nút bắt đầu crawl
  startCrawlButton.addEventListener("click", function () {
    // Reset dữ liệu đã chuyển đổi khi bắt đầu crawl mới
    convertedDataSchema.clients = [];

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
        
        // Hỗ trợ các loại tin nhắn:
        // 1. Text messages - .text-message__container .text
        // 2. Group photos - .card--group-photo .zimg-el  
        // 3. Single images - .chatImageMessage--audit .zimg-el, .img-msg-v2 .zimg-el
        // 4. Image captions - .img-msg-v2__cap .text
        // 5. Quoted messages - .message-quote-fragment__container + main text
        // 6. Recalled messages - .undo-message (XÓA KHỎI DỮ LIỆU)
        
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
            
            // 0. Kiểm tra tin nhắn recalled (thu hồi) - BỎ QUA HOÀN TOÀN
            const recalledMessage = chatItem.querySelector('.undo-message');
            if (recalledMessage && recalledMessage.textContent.includes('Tin nhắn đã được thu hồi')) {
              // Bỏ qua tin nhắn recalled, không thêm vào messages
              return; // Skip this chat-item completely
            }
            
            // 1. Kiểm tra tin nhắn quoted (trích dẫn) trước
            const quoteContainer = chatItem.querySelector('.message-quote-fragment__container');
            if (quoteContainer) {
              // Có tin nhắn quoted - xử lý riêng
              
              // BỎ QUA QUOTED CONTENT - không thêm vào messages
              // Theo logic mới: chỉ quan tâm reply text, không quan tâm quoted content
              
              // Lấy nội dung reply chính (ngoài quote container)
              const mainTextContainer = chatItem.querySelector('.text-message__container');
              if (mainTextContainer) {
                // Tìm text ngoài quote container
                const allTexts = mainTextContainer.querySelectorAll('.text');
                allTexts.forEach(textElement => {
                  // Kiểm tra xem text này có nằm trong quote container không
                  const isInsideQuote = quoteContainer.contains(textElement);
                  if (!isInsideQuote) {
                    const textContent = textElement.textContent.trim();
                    if (textContent) {
                      // CHỈ LẤY REPLY TEXT, KHÔNG QUAN TÂM QUOTED CONTENT
                      currentMessageGroup.messages.push({
                        type: "text", // Đơn giản hóa: quoted message → text
                        content: textContent
                      });
                    }
                  }
                });
              }
            } else {
              // 2. Tin nhắn văn bản thông thường (không có quote)
              const textMessages = chatItem.querySelectorAll('.text-message__container .text');
              textMessages.forEach(textMsg => {
                currentMessageGroup.messages.push({
                  type: "text",
                  content: textMsg.textContent.trim()
                });
              });
            }
            
            // 2. Tìm tin nhắn hình ảnh nhóm (Group photos)
            const groupImageMessages = chatItem.querySelectorAll('.card--group-photo .zimg-el');
            if (groupImageMessages.length > 0) {
              const imageContent = [];
              
              groupImageMessages.forEach(img => {
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
            
            // 3. Tìm tin nhắn hình ảnh đơn lẻ hoặc có caption (Single/Caption images)
            const singleImageMessages = chatItem.querySelectorAll('.chatImageMessage--audit .zimg-el, .img-msg-v2 .zimg-el');
            if (singleImageMessages.length > 0) {
              const imageContent = [];
              
              singleImageMessages.forEach(img => {
                // Kiểm tra xem hình ảnh này đã được xử lý trong group photos chưa
                const alreadyProcessed = Array.from(groupImageMessages).some(groupImg => groupImg.id === img.id);
                if (!alreadyProcessed) {
                  imageContent.push({
                    id: img.id,
                    preview_url: img.src
                  });
                }
              });
              
              if (imageContent.length > 0) {
                currentMessageGroup.messages.push({
                  type: "image",
                  content: imageContent
                });
              }
            }
            
            // 4. Tìm caption text cho hình ảnh (Image with Caption)
            const imageCaptions = chatItem.querySelectorAll('.img-msg-v2__cap .text');
            imageCaptions.forEach(captionText => {
              const captionContent = captionText.textContent.trim();
              if (captionContent) {
                currentMessageGroup.messages.push({
                  type: "text",
                  content: captionContent
                });
              }
            });
          });
        });
        
        // Lọc bỏ các nhóm tin nhắn không có tin nhắn nào
        const filteredConversations = conversations.filter(group => group.messages.length > 0);
        
        // Debug info theo logic mới
        console.log('🎯 Crawl Results Summary (New Logic):');
        filteredConversations.forEach((group, index) => {
          const totalMsg = group.messages.length;
          const textMsg = group.messages.filter(m => m.type === 'text').length;
          const imageMsg = group.messages.filter(m => m.type === 'image').length;
          const isEven = totalMsg % 2 === 0;
          const status = isEven ? '✅ EVEN' : '❌ ODD';
                     console.log('Group ' + (index + 1) + ' - ' + group.sender + ': ' + totalMsg + ' total (' + textMsg + ' text, ' + imageMsg + ' image) → ' + status);
        });
        
        return filteredConversations;
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
          // Reset dữ liệu cũ
          messageSchema.conversations = [];
          errorMessageSchema.conversations = [];

          // Kiểm tra và phân loại dữ liệu
          classifyData(result);

          // Hiển thị số lượng tin nhắn đã crawl được theo logic mới
          const totalCrawled = result.length;
          const validGroups = messageSchema.conversations.length;
          const errorGroups = errorMessageSchema.conversations.length;
          const skippedGroups = totalCrawled - validGroups - errorGroups; // Nhóm bị bỏ qua (0 messages sau filter)

          const countMessage = `✅ Crawl hoàn tất: ${totalCrawled} nhóm → ${validGroups} hợp lệ (CHẴN), ${errorGroups} lỗi (LẺ), ${skippedGroups} bỏ qua`;
          statusElement.textContent = countMessage;
          statusElement.style.backgroundColor = "#e8f5e9";
          statusElement.style.color = "#388e3c";

          // Hiển thị dữ liệu dưới dạng JSON
          displayJsonData(messageSchema);

          // Kiểm tra dữ liệu chat ngay sau khi crawl
          const checkResults = checkChatData(messageSchema.conversations);

          // Hiển thị dữ liệu dưới dạng bảng với kết quả kiểm tra
          displayTableData(messageSchema.conversations, checkResults);

          // Hiển thị dữ liệu lỗi
          displayErrorTableData(errorMessageSchema.conversations);

          console.log("Crawled data:", messageSchema);
          console.log("Error data:", errorMessageSchema);
        } else {
          resultElement.textContent = "Không tìm thấy dữ liệu phù hợp.";
          statusElement.textContent = "Không tìm thấy dữ liệu phù hợp.";
          statusElement.style.backgroundColor = "#fff8e1";
          statusElement.style.color = "#f57c00";
        }
      }
    );
  });

  // Hàm đơn giản hóa tin nhắn theo logic mới
  function simplifyMessages(messages) {
    return messages
      .map((msg) => {
        // Chuyển đổi quoted messages thành text (chỉ lấy reply text)
        if (msg.type === "quote_text" || msg.type === "quote_image") {
          return {
            type: "text",
            content: msg.content || "Reply message", // Sử dụng content nếu có, fallback to placeholder
          };
        }
        // Giữ nguyên text và image
        return msg;
      })
      .filter((msg) => {
        // Lọc bỏ recalled messages (nếu có sót)
        return msg.type !== "recalled";
      });
  }

  // Hàm phân loại dữ liệu theo logic mới
  function classifyData(conversations) {
    conversations.forEach((group) => {
      // Bước 1: Lọc và đơn giản hóa tin nhắn
      const simplifiedMessages = simplifyMessages(group.messages);

      // Bước 2: Kiểm tra sender còn tin nhắn không (sau khi lọc recalled)
      if (simplifiedMessages.length === 0) {
        // Sender không còn tin nhắn nào -> Bỏ qua hoàn toàn
        return; // Không thêm vào cả valid lẫn error
      }

      // Bước 3: Cập nhật group với messages đã simplified
      const processedGroup = {
        ...group,
        messages: simplifiedMessages,
      };

      // Bước 4: Validation theo logic mới - CHỈ CHẤP NHẬN CHẴN
      const totalMessages = simplifiedMessages.length;
      let isValid = false;
      let reason = "";

      if (totalMessages % 2 !== 0) {
        // Số lẻ -> LOẠI
        reason = `Số tin nhắn lẻ (${totalMessages}) - Chỉ chấp nhận số chẵn`;
      } else {
        // Số chẵn -> Kiểm tra từng cặp
        isValid = true;
        for (let i = 0; i < totalMessages; i += 2) {
          const msg1 = simplifiedMessages[i];
          const msg2 = simplifiedMessages[i + 1];

          // Mỗi cặp phải có 1 text + 1 image
          const hasText = msg1.type === "text" || msg2.type === "text";
          const hasImage = msg1.type === "image" || msg2.type === "image";
          const sameType = msg1.type === msg2.type;

          if (sameType || !hasText || !hasImage) {
            isValid = false;
            reason = `Cặp tin nhắn ${
              i / 2 + 1
            }: Phải có 1 text + 1 image (hiện có: ${msg1.type} + ${msg2.type})`;
            break;
          }
        }
      }

      if (isValid) {
        messageSchema.conversations.push(
          JSON.parse(JSON.stringify(processedGroup))
        );
      } else {
        const errorGroup = JSON.parse(JSON.stringify(processedGroup));
        errorGroup.errorReason = reason;
        errorMessageSchema.conversations.push(errorGroup);
      }
    });
  }

  // Hàm xóa tin nhắn trong error table
  function deleteErrorMessage(groupIndex, messageIndex) {
    // Xóa tin nhắn khỏi error schema
    errorMessageSchema.conversations[groupIndex].messages.splice(
      messageIndex,
      1
    );

    // Kiểm tra xem nhóm tin nhắn còn tin nhắn nào không
    if (errorMessageSchema.conversations[groupIndex].messages.length === 0) {
      // Nếu không còn tin nhắn nào, xóa cả nhóm
      errorMessageSchema.conversations.splice(groupIndex, 1);
    }

    // Cập nhật hiển thị error table
    displayErrorTableData(errorMessageSchema.conversations);

    // Cập nhật thông báo
    statusElement.style.display = "block";
    statusElement.textContent = "Đã xóa tin nhắn lỗi thành công.";
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";
    setTimeout(function () {
      statusElement.style.display = "none";
    }, 2000);
  }

  // Drag & Drop Variables
  let draggedElement = null;
  let dragData = null;

  // Drag & Drop Functions
  function handleDragStart(e) {
    draggedElement = this;
    dragData = {
      imageId: this.getAttribute("data-image-id"),
      imagePreview: this.getAttribute("data-image-preview"),
      sourceGroup: parseInt(this.getAttribute("data-source-group")),
      sourceMessage: parseInt(this.getAttribute("data-source-message")),
      imageIndex: parseInt(this.getAttribute("data-image-index")),
    };

    this.style.opacity = "0.5";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.outerHTML);

    console.log("🎯 Drag started:", dragData);
  }

  function handleDragEnd(e) {
    this.style.opacity = "";
    draggedElement = null;

    // Remove drag over styling from all drop targets
    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    e.dataTransfer.dropEffect = "move";
    this.classList.add("drag-over");
    return false;
  }

  function handleDragLeave(e) {
    this.classList.remove("drag-over");
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    this.classList.remove("drag-over");

    if (!dragData) return false;

    // Lấy target message information
    const targetMessageRow = this.closest(".message-row");
    if (!targetMessageRow) return false;

    const targetGroupIndex = parseInt(
      targetMessageRow
        .querySelector(".message-content")
        .getAttribute("data-group-index")
    );
    const targetMessageIndex = parseInt(
      targetMessageRow
        .querySelector(".message-content")
        .getAttribute("data-message-index")
    );

    console.log("🎯 Drop target:", { targetGroupIndex, targetMessageIndex });

    // Thực hiện move image
    moveImageBetweenMessages(dragData, targetGroupIndex, targetMessageIndex);

    return false;
  }

  function moveImageBetweenMessages(
    dragData,
    targetGroupIndex,
    targetMessageIndex
  ) {
    const sourceGroup = errorMessageSchema.conversations[dragData.sourceGroup];
    const sourceMessage = sourceGroup.messages[dragData.sourceMessage];
    const targetGroup = errorMessageSchema.conversations[targetGroupIndex];
    const targetMessage = targetGroup.messages[targetMessageIndex];

    // Chỉ cho phép move image vào message type "image"
    if (targetMessage.type !== "image") {
      statusElement.style.display = "block";
      statusElement.textContent =
        "❌ Chỉ có thể di chuyển hình ảnh vào tin nhắn loại IMAGE!";
      statusElement.style.backgroundColor = "#ffebee";
      statusElement.style.color = "#d32f2f";
      setTimeout(() => (statusElement.style.display = "none"), 3000);
      return;
    }

    // Lấy image data từ source
    const imageData = sourceMessage.content[dragData.imageIndex];

    // Thêm vào target message
    targetMessage.content.push(imageData);

    // Xóa khỏi source message
    sourceMessage.content.splice(dragData.imageIndex, 1);

    // Nếu source message không còn images, xóa message
    if (sourceMessage.content.length === 0) {
      sourceGroup.messages.splice(dragData.sourceMessage, 1);

      // Nếu group không còn messages, xóa group
      if (sourceGroup.messages.length === 0) {
        errorMessageSchema.conversations.splice(dragData.sourceGroup, 1);
      }
    }

    // Cập nhật hiển thị
    displayErrorTableData(errorMessageSchema.conversations);

    // Thông báo thành công
    statusElement.style.display = "block";
    statusElement.textContent = `✅ Đã di chuyển hình ảnh ${imageData.id} thành công!`;
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";
    setTimeout(() => (statusElement.style.display = "none"), 3000);

    console.log("🎯 Image moved successfully:", imageData.id);
  }

  // Hàm copy dữ liệu với fallback methods
  async function copyToClipboard(text) {
    try {
      // Method 1: Thử Chrome extension API
      if (chrome && chrome.runtime && chrome.runtime.getURL) {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: "COPY_TO_CLIPBOARD",
              text: text,
            },
            (response) => {
              if (response && response.success) {
                resolve();
              } else {
                reject(new Error("Chrome API failed"));
              }
            }
          );
        });
        return "chrome_api";
      }
    } catch (error) {
      console.log("Chrome API method failed:", error);
    }

    try {
      // Method 2: Thử Clipboard API (nếu có permission)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return "clipboard_api";
      }
    } catch (error) {
      console.log("Clipboard API method failed:", error);
    }

    try {
      // Method 3: Fallback với execCommand (deprecated nhưng vẫn hoạt động)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        return "exec_command";
      } else {
        throw new Error("execCommand failed");
      }
    } catch (error) {
      console.log("execCommand method failed:", error);
    }

    // Method 4: Download as file (last resort)
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zalo-crawler-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return "download";
  }

  // Sự kiện click nút sao chép dữ liệu
  copyDataButton.addEventListener("click", async function () {
    // Lấy dữ liệu hiện đang được hiển thị trong tab JSON
    let dataToExport = currentDisplayedJsonData;

    // Fallback: nếu chưa có dữ liệu nào được hiển thị, sử dụng logic cũ
    if (!dataToExport) {
      const activeTab = document
        .querySelector(".tab.active")
        .getAttribute("data-tab");

      if (activeTab === "table") {
        // Nếu đang ở tab dữ liệu hợp lệ
        // Kiểm tra xem đã chuyển đổi dữ liệu chưa
        if (convertedDataSchema.clients.length > 0) {
          dataToExport = convertedDataSchema;
        } else {
          dataToExport = messageSchema;
        }
      } else if (activeTab === "error") {
        // Nếu đang ở tab dữ liệu lỗi
        dataToExport = errorMessageSchema;
      } else if (activeTab === "downloads") {
        // Nếu đang ở tab tải xuống
        dataToExport = DownloadedImageSchema;
      } else {
        // Mặc định là dữ liệu hợp lệ
        dataToExport = messageSchema;
      }
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);

    try {
      const method = await copyToClipboard(jsonString);

      // Xác định loại dữ liệu đang được copy
      let dataType = "dữ liệu";
      if (dataToExport === messageSchema) {
        dataType = "dữ liệu crawl gốc";
      } else if (dataToExport === convertedDataSchema) {
        dataType = "dữ liệu đã chuyển đổi";
      } else if (dataToExport === errorMessageSchema) {
        dataType = "dữ liệu lỗi";
      } else if (dataToExport === DownloadedImageSchema) {
        dataType = "dữ liệu tải xuống";
      }

      statusElement.style.display = "block";
      statusElement.style.backgroundColor = "#e8f5e9";
      statusElement.style.color = "#388e3c";

      if (method === "download") {
        statusElement.textContent = `${dataType} đã được tải xuống dưới dạng file JSON!`;
      } else {
        statusElement.textContent = `Đã sao chép ${dataType} vào clipboard! (${method})`;
      }

      setTimeout(function () {
        statusElement.style.display = "none";
      }, 3000);
    } catch (err) {
      statusElement.style.display = "block";
      statusElement.textContent = "Không thể sao chép dữ liệu: " + err.message;
      statusElement.style.backgroundColor = "#ffebee";
      statusElement.style.color = "#d32f2f";
    }
  });

  // Sự kiện click nút kiểm tra dữ liệu chat
  checkDataButton.addEventListener("click", function () {
    if (messageSchema.conversations.length === 0) {
      statusElement.style.display = "block";
      statusElement.textContent =
        "Chưa có dữ liệu để kiểm tra. Vui lòng crawl dữ liệu trước.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    // Kiểm tra dữ liệu
    const checkResults = checkChatData(messageSchema.conversations);

    // Hiển thị kết quả kiểm tra
    displayTableData(messageSchema.conversations, checkResults);

    // Hiển thị thông báo theo logic mới
    statusElement.style.display = "block";
    const validGroups =
      checkResults.totalGroups - checkResults.problematicGroups;
    statusElement.textContent = `🔍 Kiểm tra hoàn tất: ${validGroups} nhóm CHUẨN (chẵn + text-image pairs), ${checkResults.problematicGroups} nhóm LỖI`;

    if (checkResults.problematicGroups > 0) {
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
    } else {
      statusElement.style.backgroundColor = "#e8f5e9";
      statusElement.style.color = "#388e3c";
    }
  });

  // Sự kiện click nút chuyển đổi dữ liệu
  convertDataButton.addEventListener("click", function () {
    if (messageSchema.conversations.length === 0) {
      statusElement.style.display = "block";
      statusElement.textContent =
        "Chưa có dữ liệu để chuyển đổi. Vui lòng crawl dữ liệu trước.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    // Thực hiện chuyển đổi dữ liệu
    convertData(messageSchema.conversations);

    // Hiển thị dữ liệu đã chuyển đổi
    displayConvertedData(convertedDataSchema.clients);

    // Hiển thị thông báo theo logic mới
    statusElement.style.display = "block";
    statusElement.textContent = `🎯 Chuyển đổi thành công: ${convertedDataSchema.clients.length} cặp khách hàng (text + images) từ ${messageSchema.conversations.length} nhóm hợp lệ`;
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";

    // Nếu đang ở tab JSON, cập nhật hiển thị JSON với dữ liệu đã chuyển đổi
    const activeTab = document
      .querySelector(".tab.active")
      .getAttribute("data-tab");
    if (activeTab === "json") {
      displayJsonData(convertedDataSchema);
    }
  });

  // Sự kiện click nút tải tất cả hình ảnh
  getAllImagesButton.addEventListener("click", function () {
    if (convertedDataSchema.clients.length === 0) {
      statusElement.style.display = "block";
      statusElement.textContent =
        "Chưa có dữ liệu đã chuyển đổi. Vui lòng chuyển đổi dữ liệu trước.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    // Hiển thị thông báo đang tải
    statusElement.style.display = "block";
    statusElement.textContent = "Đang chuẩn bị tải hình ảnh...";
    statusElement.style.backgroundColor = "#e3f2fd";
    statusElement.style.color = "#1976d2";

    // Gửi lệnh tải hình ảnh đến trang web Zalo
    downloadAllImages(convertedDataSchema.clients);
  });

  // Sự kiện click nút Test Electron
  testElectronButton.addEventListener("click", function () {
    const originalText = testElectronButton.textContent;

    // Cập nhật trạng thái nút
    testElectronButton.textContent = "📤 Đang gửi...";
    testElectronButton.className = "sending";
    testElectronButton.disabled = true;

    // Tạo tin nhắn test
    const testMessage = {
      action: "TEST_FROM_PANEL",
      timestamp: Date.now(),
      source: "extension_panel",
      message: "Test tin nhắn từ Extension Panel! 🎯",
      data: {
        panelInfo: "Zalo Crawler Extension Panel",
        testId: Math.floor(Math.random() * 10000),
        currentTab:
          document.querySelector(".tab.active")?.getAttribute("data-tab") ||
          "unknown",
      },
    };

    console.log("Sending test message to Electron:", testMessage);

    // Hiển thị thông báo
    statusElement.style.display = "block";
    statusElement.textContent = "Đang gửi tin nhắn test đến Electron App...";
    statusElement.style.backgroundColor = "#e3f2fd";
    statusElement.style.color = "#1976d2";

    // Gửi tin nhắn qua background script
    chrome.runtime.sendMessage(
      {
        action: "SEND_TO_ELECTRON",
        data: testMessage,
      },
      (response) => {
        console.log("Response from background script:", response);

        // Reset nút sau 1 giây
        setTimeout(() => {
          testElectronButton.disabled = false;

          if (response && response.success) {
            testElectronButton.textContent = "✅ Đã gửi!";
            testElectronButton.className = "success";

            statusElement.textContent =
              "Tin nhắn test đã được gửi thành công đến Electron App!";
            statusElement.style.backgroundColor = "#e8f5e9";
            statusElement.style.color = "#388e3c";
          } else {
            testElectronButton.textContent = "❌ Lỗi!";
            testElectronButton.className = "error";

            statusElement.textContent =
              "Không thể gửi tin nhắn đến Electron App. Kiểm tra kết nối.";
            statusElement.style.backgroundColor = "#ffebee";
            statusElement.style.color = "#d32f2f";
          }

          // Reset nút về trạng thái ban đầu sau 3 giây
          setTimeout(() => {
            testElectronButton.textContent = originalText;
            testElectronButton.className = "";
            statusElement.style.display = "none";
          }, 3000);
        }, 1000);
      }
    );
  });

  // Hàm tải tất cả hình ảnh từ dữ liệu khách hàng
  function downloadAllImages(clients) {
    // Đếm tổng số hình ảnh cần tải
    let totalImages = 0;
    clients.forEach((client) => {
      totalImages += client.images.length;
    });

    if (totalImages === 0) {
      statusElement.textContent = "Không có hình ảnh nào để tải.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    statusElement.textContent = `Chuẩn bị tải ${totalImages} hình ảnh...`;

    // Chuẩn bị dữ liệu cho tải xuống
    const imageDataList = [];
    clients.forEach((client) => {
      client.images.forEach((img) => {
        imageDataList.push({
          id: img.id,
          clientText: client.text,
        });
      });
    });

    // Hiển thị thông báo đang tải
    let dots = "";
    const loadingInterval = setInterval(() => {
      dots = dots.length >= 3 ? "" : dots + ".";
      statusElement.textContent = `Đang tải hình ảnh${dots} (Quá trình này có thể mất vài phút)`;
    }, 500);

    // Biến để theo dõi tiến trình
    let currentIndex = 0;
    let successCount = 0;
    let failCount = 0;

    // Hàm tải một hình ảnh và đợi cho đến khi có tên file
    function downloadSingleImageAndWait(imageData) {
      return new Promise((resolveDownload) => {
        // Tạo một listener tạm thời để theo dõi sự kiện tải xuống
        const downloadListener = (message) => {
          if (
            (message.action === "DOWNLOAD_CREATED" ||
              message.action === "DOWNLOAD_COMPLETED") &&
            downloadQueue.length > 0 &&
            downloadQueue[0].imageId === imageData.id
          ) {
            // Đã nhận được thông tin tải xuống cho hình ảnh này
            console.log(
              `Đã nhận thông tin tải xuống cho hình ảnh ${imageData.id}:`,
              message.downloadItem
            );

            // Xóa listener vì không cần nữa
            chrome.runtime.onMessage.removeListener(downloadListener);

            // Xóa khỏi hàng đợi vì đã xử lý xong
            downloadQueue.shift();

            // Đánh dấu thành công
            successCount++;

            // Hoàn thành promise
            resolveDownload(true);
          }
        };

        // Đăng ký listener
        chrome.runtime.onMessage.addListener(downloadListener);

        // Thêm timeout để tránh treo
        const timeoutId = setTimeout(() => {
          chrome.runtime.onMessage.removeListener(downloadListener);
          console.log(`Hết thời gian chờ cho hình ảnh ${imageData.id}`);
          failCount++;
          resolveDownload(false);
        }, 10000); // 10 giây timeout

        // Thêm vào hàng đợi tải xuống
        downloadQueue.push({
          imageId: imageData.id,
          clientText: imageData.clientText,
          timestamp: Date.now(),
        });

        // Gửi lệnh tải xuống
        chrome.devtools.inspectedWindow.eval(
          `
          (function() {
            // Hàm tải một hình ảnh từ ID
            async function downloadImage(imageId) {
              return new Promise((resolve, reject) => {
                try {
                  // Tìm hình ảnh theo ID
                  const imageElement = document.getElementById(imageId);
                  
                  if (!imageElement) {
                    console.warn("Không tìm thấy hình ảnh với ID:", imageId);
                    resolve(false);
                    return;
                  }
                  
                  // Tạo sự kiện chuột phải
                  const contextEvent = new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                  });
                  
                  // Thực hiện chuột phải vào hình ảnh
                  imageElement.dispatchEvent(contextEvent);
                  
                  // Đợi một chút để context menu xuất hiện
                  setTimeout(() => {
                    // Tìm menu tải xuống (phần tử thứ 3 trong context menu)
                    const menuItems = document.querySelectorAll(
                      ".popover-v3 .zmenu-body .zmenu-item"
                    );
                    
                    if (menuItems.length >= 3) {
                      // Click vào nút "Tải xuống"
                      menuItems[2].click();
                      resolve(true);
                    } else {
                      console.warn("Không tìm thấy menu tải xuống");
                      resolve(false);
                    }
                  }, 100);
                } catch (error) {
                  console.error("Lỗi khi tải hình ảnh:", error);
                  resolve(false);
                }
              });
            }
            
            // Tải hình ảnh
            return downloadImage("${imageData.id}");
          })();
          `,
          (result, isException) => {
            if (isException) {
              console.error("Lỗi khi tải hình ảnh:", isException);
              clearTimeout(timeoutId);
              chrome.runtime.onMessage.removeListener(downloadListener);
              failCount++;
              resolveDownload(false);
            }

            // Nếu không thành công, hủy ngay
            if (result === false) {
              clearTimeout(timeoutId);
              chrome.runtime.onMessage.removeListener(downloadListener);
              failCount++;
              resolveDownload(false);
            }

            // Nếu thành công, đợi sự kiện tải xuống từ background script
            // Không resolve ở đây vì chúng ta cần đợi sự kiện từ background
          }
        );
      });
    }

    // Tải tuần tự từng hình ảnh
    function processImages(index) {
      if (index >= imageDataList.length) {
        // Đã hoàn thành tất cả
        clearInterval(loadingInterval);
        statusElement.textContent = `Đã tải ${successCount} hình ảnh thành công, ${failCount} hình ảnh thất bại.`;
        statusElement.style.backgroundColor = "#e8f5e9";
        statusElement.style.color = "#388e3c";
        return;
      }

      const imageData = imageDataList[index];
      currentIndex = index;

      // Cập nhật trạng thái
      statusElement.textContent = `Đang tải hình ảnh ${index + 1}/${
        imageDataList.length
      }: ${imageData.id}`;

      // Tải hình ảnh và đợi hoàn thành
      downloadSingleImageAndWait(imageData).then((success) => {
        // Đợi thêm 300ms trước khi tải hình tiếp theo
        setTimeout(() => {
          processImages(index + 1);
        }, 300);
      });
    }

    // Bắt đầu tải hình ảnh
    processImages(0);
  }

  // Hàm chuyển đổi dữ liệu theo logic mới - CHỈ XỬ LÝ CHẴN MESSAGES
  function convertData(conversations) {
    // Reset dữ liệu chuyển đổi cũ
    convertedDataSchema.clients = [];

    // Duyệt qua từng nhóm tin nhắn (chỉ những nhóm đã PASS validation)
    conversations.forEach((group) => {
      const messages = group.messages;

      // Logic đơn giản: Xử lý từng cặp tin nhắn liên tiếp
      for (let i = 0; i < messages.length; i += 2) {
        const msg1 = messages[i];
        const msg2 = messages[i + 1];

        const clientData = {
          text: "",
          images: [],
          error: false,
        };

        // Xử lý cặp tin nhắn
        if (msg1.type === "text") {
          clientData.text = msg1.content;
        } else if (msg1.type === "image") {
          clientData.images = clientData.images.concat(msg1.content);
        }

        if (msg2.type === "text") {
          clientData.text = msg2.content;
        } else if (msg2.type === "image") {
          clientData.images = clientData.images.concat(msg2.content);
        }

        // Kiểm tra error case (same type - không nên xảy ra nếu validation đúng)
        if (msg1.type === msg2.type) {
          clientData.error = true;
        }

        convertedDataSchema.clients.push(clientData);
      }
    });
  }

  // Hàm hiển thị dữ liệu đã chuyển đổi
  function displayConvertedData(clients) {
    // Xóa nội dung cũ
    messageTableElement.innerHTML = "";

    // Tạo bảng
    const table = document.createElement("table");
    table.className = "message-table";

    // Duyệt qua từng client
    clients.forEach((client, clientIndex) => {
      // Tạo nhóm tin nhắn
      const clientGroup = document.createElement("tbody");
      clientGroup.className = "message-group";

      // Nếu có lỗi, thêm class BorderAlert
      if (client.error) {
        clientGroup.classList.add("BorderAlert");
        clientGroup.setAttribute(
          "data-reason",
          "Hai tin nhắn liền kề cùng loại"
        );
      }

      // Tạo hàng hiển thị nội dung text
      const textRow = document.createElement("tr");
      textRow.className = "client-row";

      const textCell = document.createElement("td");
      textCell.className = "client-cell";
      textCell.colSpan = 2;
      textCell.textContent = client.text || "(Không có nội dung văn bản)";

      textRow.appendChild(textCell);
      clientGroup.appendChild(textRow);

      // Tạo hàng hiển thị hình ảnh
      const imageRow = document.createElement("tr");
      imageRow.className = "message-row";

      const typeCell = document.createElement("td");
      typeCell.className = "message-type";
      typeCell.textContent = "image";

      const contentCell = document.createElement("td");
      contentCell.className = "message-content";

      // Hiển thị hình ảnh
      if (client.images && client.images.length > 0) {
        const imageGrid = document.createElement("div");
        imageGrid.className = "image-grid drop-target";

        // Drop target events cho grid
        imageGrid.addEventListener("dragover", handleDragOver);
        imageGrid.addEventListener("dragleave", handleDragLeave);
        imageGrid.addEventListener("drop", handleDrop);

        client.images.forEach((img, imgIndex) => {
          const imageItem = document.createElement("div");
          imageItem.className = "image-item dragable";
          imageItem.draggable = true;
          imageItem.setAttribute("data-image-id", img.id);
          imageItem.setAttribute("data-image-preview", img.preview_url);
          imageItem.setAttribute("data-source-group", clientIndex);
          imageItem.setAttribute("data-source-message", imgIndex);
          imageItem.setAttribute("data-image-index", imgIndex);

          const image = document.createElement("img");
          image.className = "image-preview";
          image.src = img.preview_url;
          image.alt = "Image";

          const imageId = document.createElement("div");
          imageId.className = "image-id";
          imageId.textContent = img.id;

          // Drag events
          imageItem.addEventListener("dragstart", handleDragStart);
          imageItem.addEventListener("dragend", handleDragEnd);

          imageItem.appendChild(image);
          imageItem.appendChild(imageId);
          imageGrid.appendChild(imageItem);
        });

        contentCell.appendChild(imageGrid);
      } else {
        contentCell.textContent = "(Không có hình ảnh)";
      }

      imageRow.appendChild(typeCell);
      imageRow.appendChild(contentCell);
      clientGroup.appendChild(imageRow);

      table.appendChild(clientGroup);
    });

    messageTableElement.appendChild(table);
  }

  // Hàm tải một hình ảnh duy nhất
  function downloadSingleImage(imageId, clientText = "") {
    statusElement.style.display = "block";
    statusElement.textContent = `Đang tải hình ảnh: ${imageId}...`;
    statusElement.style.backgroundColor = "#e3f2fd";
    statusElement.style.color = "#1976d2";

    // Tạo Promise để theo dõi quá trình tải xuống
    const downloadPromise = new Promise((resolve) => {
      // Tạo một listener tạm thời để theo dõi sự kiện tải xuống
      const downloadListener = (message) => {
        if (
          (message.action === "DOWNLOAD_CREATED" ||
            message.action === "DOWNLOAD_COMPLETED") &&
          downloadQueue.length > 0 &&
          downloadQueue[0].imageId === imageId
        ) {
          // Đã nhận được thông tin tải xuống cho hình ảnh này
          console.log(
            `Đã nhận thông tin tải xuống cho hình ảnh ${imageId}:`,
            message.downloadItem
          );

          // Xóa listener vì không cần nữa
          chrome.runtime.onMessage.removeListener(downloadListener);

          // Xóa khỏi hàng đợi vì đã xử lý xong
          downloadQueue.shift();

          // Hoàn thành promise
          resolve(true);
        }
      };

      // Đăng ký listener
      chrome.runtime.onMessage.addListener(downloadListener);

      // Thêm timeout để tránh treo
      const timeoutId = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(downloadListener);
        console.log(`Hết thời gian chờ cho hình ảnh ${imageId}`);
        resolve(false);
      }, 10000); // 10 giây timeout

      // Thêm vào hàng đợi tải xuống
      downloadQueue.push({
        imageId: imageId,
        clientText: clientText,
        timestamp: Date.now(),
      });

      console.log("Thêm vào hàng đợi tải xuống:", {
        imageId: imageId,
        clientText: clientText,
      });

      chrome.devtools.inspectedWindow.eval(
        `
        (function() {
          // Hàm tải một hình ảnh từ ID
          async function downloadImage(imageId) {
            return new Promise((resolve, reject) => {
              try {
                // Tìm hình ảnh theo ID
                const imageElement = document.getElementById(imageId);
                
                if (!imageElement) {
                  console.warn("Không tìm thấy hình ảnh với ID:", imageId);
                  resolve(false);
                  return;
                }
                
                // Tạo sự kiện chuột phải
                const contextEvent = new MouseEvent("contextmenu", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                });
                
                // Thực hiện chuột phải vào hình ảnh
                imageElement.dispatchEvent(contextEvent);
                
                // Đợi một chút để context menu xuất hiện
                setTimeout(() => {
                  // Tìm menu tải xuống (phần tử thứ 3 trong context menu)
                  const menuItems = document.querySelectorAll(
                    ".popover-v3 .zmenu-body .zmenu-item"
                  );
                  
                  if (menuItems.length >= 3) {
                    // Click vào nút "Tải xuống"
                    menuItems[2].click();
                    resolve(true);
                  } else {
                    console.warn("Không tìm thấy menu tải xuống");
                    resolve(false);
                  }
                }, 100);
              } catch (error) {
                console.error("Lỗi khi tải hình ảnh:", error);
                resolve(false);
              }
            });
          }
          
          // Tải hình ảnh
          return downloadImage("${imageId}");
        })();
        `,
        (result, isException) => {
          if (isException) {
            console.error("Lỗi khi tải hình ảnh:", isException);
            clearTimeout(timeoutId);
            chrome.runtime.onMessage.removeListener(downloadListener);

            statusElement.textContent =
              "Lỗi khi tải hình ảnh: " + isException.value;
            statusElement.style.backgroundColor = "#ffebee";
            statusElement.style.color = "#d32f2f";

            // Xóa khỏi hàng đợi nếu có lỗi
            downloadQueue = downloadQueue.filter(
              (item) => item.imageId !== imageId
            );
            resolve(false);
            return;
          }

          if (result === false) {
            statusElement.textContent =
              "Không thể tải hình ảnh. Vui lòng thử lại.";
            statusElement.style.backgroundColor = "#fff8e1";
            statusElement.style.color = "#f57c00";

            clearTimeout(timeoutId);
            chrome.runtime.onMessage.removeListener(downloadListener);

            // Xóa khỏi hàng đợi nếu không thành công
            downloadQueue = downloadQueue.filter(
              (item) => item.imageId !== imageId
            );
            resolve(false);
          }

          // Nếu thành công, đợi sự kiện tải xuống từ background script
          // Không resolve ở đây vì chúng ta cần đợi sự kiện từ background
        }
      );
    });

    // Xử lý kết quả sau khi tải xuống
    downloadPromise.then((success) => {
      if (success) {
        statusElement.textContent = "Đã tải hình ảnh thành công!";
        statusElement.style.backgroundColor = "#e8f5e9";
        statusElement.style.color = "#388e3c";

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          statusElement.style.display = "none";
        }, 3000);
      }
    });
  }

  // Hàm kiểm tra dữ liệu chat theo logic mới
  function checkChatData(conversations) {
    let problematicGroups = 0;
    const results = {
      problematicGroupIndexes: [],
      totalGroups: conversations.length,
      problematicGroups: 0,
      reasons: [],
    };

    conversations.forEach((group, index) => {
      let isProblematic = false;
      let reason = "";

      // Áp dụng logic giống như classifyData
      const totalMessages = group.messages.length;

      if (totalMessages % 2 !== 0) {
        // Số lẻ -> LOẠI
        isProblematic = true;
        reason = `Số tin nhắn lẻ (${totalMessages}) - Chỉ chấp nhận số chẵn`;
      } else {
        // Số chẵn -> Kiểm tra từng cặp
        for (let i = 0; i < totalMessages; i += 2) {
          const msg1 = group.messages[i];
          const msg2 = group.messages[i + 1];

          // Mỗi cặp phải có 1 text + 1 image
          const hasText = msg1.type === "text" || msg2.type === "text";
          const hasImage = msg1.type === "image" || msg2.type === "image";
          const sameType = msg1.type === msg2.type;

          if (sameType || !hasText || !hasImage) {
            isProblematic = true;
            reason = `Cặp tin nhắn ${
              i / 2 + 1
            }: Phải có 1 text + 1 image (hiện có: ${msg1.type} + ${msg2.type})`;
            break;
          }
        }
      }

      if (isProblematic) {
        results.problematicGroupIndexes.push(index);
        results.reasons[index] = reason;
        problematicGroups++;
      }
    });

    results.problematicGroups = problematicGroups;
    return results;
  }

  // Hàm xóa tin nhắn
  function deleteMessage(groupIndex, messageIndex) {
    // Xóa tin nhắn khỏi schema
    messageSchema.conversations[groupIndex].messages.splice(messageIndex, 1);

    // Kiểm tra xem nhóm tin nhắn còn tin nhắn nào không
    if (messageSchema.conversations[groupIndex].messages.length === 0) {
      // Nếu không còn tin nhắn nào, xóa cả nhóm
      messageSchema.conversations.splice(groupIndex, 1);
    }

    // Cập nhật hiển thị JSON
    displayJsonData(messageSchema);

    // Kiểm tra dữ liệu sau khi xóa tin nhắn
    const checkResults = checkChatData(messageSchema.conversations);

    // Cập nhật hiển thị bảng với kết quả kiểm tra
    displayTableData(messageSchema.conversations, checkResults);

    // Cập nhật thông báo
    statusElement.style.display = "block";
    statusElement.textContent = "Đã xóa tin nhắn thành công.";
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";
    setTimeout(function () {
      statusElement.style.display = "none";
    }, 2000);
  }

  // Hàm hiển thị dữ liệu dưới dạng JSON
  function displayJsonData(data) {
    // Kiểm tra tab nào đang được hiển thị để quyết định hiển thị dữ liệu nào
    const activeTab = document
      .querySelector(".tab.active")
      .getAttribute("data-tab");
    let dataToDisplay;

    if (activeTab === "table") {
      // Nếu đang ở tab dữ liệu hợp lệ
      // Kiểm tra xem đã chuyển đổi dữ liệu chưa
      if (convertedDataSchema.clients.length > 0) {
        dataToDisplay = convertedDataSchema;
      } else {
        dataToDisplay = data;
      }
    } else if (activeTab === "error") {
      // Nếu đang ở tab dữ liệu lỗi
      dataToDisplay = errorMessageSchema;
    } else {
      // Mặc định là dữ liệu được truyền vào
      dataToDisplay = data;
    }

    // Lưu dữ liệu hiện đang được hiển thị để có thể copy chính xác
    currentDisplayedJsonData = dataToDisplay;

    // Chuyển đổi JSON thành chuỗi có định dạng đẹp
    const jsonString = JSON.stringify(dataToDisplay, null, 2);

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
  function displayTableData(conversations, checkResults = null) {
    // Xóa nội dung cũ
    messageTableElement.innerHTML = "";

    // Tạo bảng
    const table = document.createElement("table");
    table.className = "message-table";

    // Duyệt qua từng nhóm tin nhắn
    conversations.forEach((group, groupIndex) => {
      // Tạo nhóm tin nhắn
      const messageGroup = document.createElement("tbody");
      messageGroup.className = "message-group";

      // Nếu có kết quả kiểm tra và nhóm này có vấn đề, thêm class BorderAlert
      if (
        checkResults &&
        checkResults.problematicGroupIndexes.includes(groupIndex)
      ) {
        messageGroup.classList.add("BorderAlert");

        // Thêm thông tin lý do vào data attribute
        messageGroup.setAttribute(
          "data-reason",
          checkResults.reasons[groupIndex]
        );
      }

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
      group.messages.forEach((message, messageIndex) => {
        const messageRow = document.createElement("tr");
        messageRow.className = "message-row";
        messageRow.setAttribute("data-group-index", groupIndex);
        messageRow.setAttribute("data-message-index", messageIndex);

        const typeCell = document.createElement("td");
        typeCell.className = "message-type";
        typeCell.textContent = message.type;

        const contentCell = document.createElement("td");
        contentCell.className = "message-content";

        // Tạo nút xóa
        const deleteButton = document.createElement("div");
        deleteButton.className = "delete-message";
        deleteButton.innerHTML = "×"; // Dấu X
        deleteButton.title = "Xóa tin nhắn này";
        deleteButton.addEventListener("click", function (e) {
          e.stopPropagation(); // Ngăn sự kiện lan ra ngoài
          if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
            deleteMessage(groupIndex, messageIndex);
          }
        });

        contentCell.appendChild(deleteButton);

        // Hiển thị nội dung tin nhắn tùy theo loại (chỉ text và image)
        if (message.type === "text") {
          contentCell.appendChild(document.createTextNode(message.content));
        } else if (message.type === "image") {
          const imageGrid = document.createElement("div");
          imageGrid.className = "image-grid drop-target";

          // Drop target events cho grid
          imageGrid.addEventListener("dragover", handleDragOver);
          imageGrid.addEventListener("dragleave", handleDragLeave);
          imageGrid.addEventListener("drop", handleDrop);

          message.content.forEach((img, imgIndex) => {
            const imageItem = document.createElement("div");
            imageItem.className = "image-item dragable";
            imageItem.draggable = true;
            imageItem.setAttribute("data-image-id", img.id);
            imageItem.setAttribute("data-image-preview", img.preview_url);
            imageItem.setAttribute("data-source-group", groupIndex);
            imageItem.setAttribute("data-source-message", messageIndex);
            imageItem.setAttribute("data-image-index", imgIndex);

            const image = document.createElement("img");
            image.className = "image-preview";
            image.src = img.preview_url;
            image.alt = "Image";

            const imageId = document.createElement("div");
            imageId.className = "image-id";
            imageId.textContent = img.id;

            // Drag events
            imageItem.addEventListener("dragstart", handleDragStart);
            imageItem.addEventListener("dragend", handleDragEnd);

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

  // Hàm hiển thị dữ liệu lỗi dưới dạng bảng
  function displayErrorTableData(conversations) {
    // Xóa nội dung cũ
    errorMessageTableElement.innerHTML = "";

    // Nếu không có dữ liệu lỗi, hiển thị thông báo
    if (conversations.length === 0) {
      const noDataMessage = document.createElement("div");
      noDataMessage.className = "no-data-message";
      noDataMessage.textContent = "Không có dữ liệu lỗi.";
      errorMessageTableElement.appendChild(noDataMessage);
      return;
    }

    // Tạo bảng
    const table = document.createElement("table");
    table.className = "message-table error-table";

    // Duyệt qua từng nhóm tin nhắn
    conversations.forEach((group, groupIndex) => {
      // Tạo nhóm tin nhắn
      const messageGroup = document.createElement("tbody");
      messageGroup.className = "message-group BorderAlert";

      // Tạo hàng hiển thị người gửi
      const senderRow = document.createElement("tr");
      senderRow.className = "sender-row";

      const senderCell = document.createElement("td");
      senderCell.className = "sender-cell";
      senderCell.colSpan = 2;
      senderCell.textContent = group.sender || "Unknown";

      // Thêm lý do lỗi
      const totalMessages = group.messages.length;
      const imageMessages = group.messages.filter(
        (msg) => msg.type === "image"
      ).length;
      const textMessages = group.messages.filter(
        (msg) => msg.type === "text"
      ).length;

      // Sử dụng errorReason đã được lưu từ classifyData nếu có
      let reason = group.errorReason || "";

      // Nếu chưa có reason, tính toán lại theo logic mới
      if (!reason) {
        if (totalMessages === 0) {
          reason = "Nhóm không có tin nhắn nào";
        } else if (totalMessages % 2 !== 0) {
          reason = `Số tin nhắn lẻ (${totalMessages}) - Chỉ chấp nhận số chẵn`;
        } else {
          // Kiểm tra từng cặp
          for (let i = 0; i < totalMessages; i += 2) {
            const msg1 = group.messages[i];
            const msg2 = group.messages[i + 1];

            const hasText = msg1.type === "text" || msg2.type === "text";
            const hasImage = msg1.type === "image" || msg2.type === "image";
            const sameType = msg1.type === msg2.type;

            if (sameType || !hasText || !hasImage) {
              reason = `Cặp tin nhắn ${
                i / 2 + 1
              }: Phải có 1 text + 1 image (hiện có: ${msg1.type} + ${
                msg2.type
              })`;
              break;
            }
          }
        }
      }

      const reasonElement = document.createElement("div");
      reasonElement.className = "error-reason";
      reasonElement.textContent = `Lý do: ${reason}`;
      senderCell.appendChild(document.createElement("br"));
      senderCell.appendChild(reasonElement);

      // Thêm Quick Fix buttons
      const quickFixContainer = document.createElement("div");
      quickFixContainer.className = "quick-fix-buttons";
      quickFixContainer.style.marginTop = "10px";

      // Auto Fix button
      const autoFixBtn = document.createElement("button");
      autoFixBtn.className = "quick-fix-btn auto-fix";
      autoFixBtn.innerHTML = "🤖 Auto Fix";
      autoFixBtn.title = "Tự động sửa lỗi";
      autoFixBtn.addEventListener("click", () => autoFixGroup(groupIndex));

      // Delete Group button
      const deleteGroupBtn = document.createElement("button");
      deleteGroupBtn.className = "quick-fix-btn delete-group";
      deleteGroupBtn.innerHTML = "🗑️ Delete Group";
      deleteGroupBtn.title = "Xóa toàn bộ nhóm";
      deleteGroupBtn.addEventListener("click", () =>
        deleteErrorGroup(groupIndex)
      );

      // Move to Valid button
      const moveToValidBtn = document.createElement("button");
      moveToValidBtn.className = "quick-fix-btn move-valid";
      moveToValidBtn.innerHTML = "✅ Force Valid";
      moveToValidBtn.title = "Chuyển sang dữ liệu hợp lệ";
      moveToValidBtn.addEventListener("click", () =>
        forceValidGroup(groupIndex)
      );

      quickFixContainer.appendChild(autoFixBtn);
      quickFixContainer.appendChild(deleteGroupBtn);
      quickFixContainer.appendChild(moveToValidBtn);
      senderCell.appendChild(quickFixContainer);

      senderRow.appendChild(senderCell);
      messageGroup.appendChild(senderRow);

      // Duyệt qua từng tin nhắn trong nhóm
      group.messages.forEach((message, messageIndex) => {
        const messageRow = document.createElement("tr");
        messageRow.className = "message-row";

        const typeCell = document.createElement("td");
        typeCell.className = "message-type";
        typeCell.textContent = message.type;

        const contentCell = document.createElement("td");
        contentCell.className = "message-content";
        contentCell.setAttribute("data-group-index", groupIndex);
        contentCell.setAttribute("data-message-index", messageIndex);

        // Tạo nút xóa cho error messages
        const deleteButton = document.createElement("div");
        deleteButton.className = "delete-message";
        deleteButton.innerHTML = "×"; // Dấu X
        deleteButton.title = "Xóa tin nhắn này";
        deleteButton.addEventListener("click", function (e) {
          e.stopPropagation();
          if (confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
            deleteErrorMessage(groupIndex, messageIndex);
          }
        });
        contentCell.appendChild(deleteButton);

        // Hiển thị nội dung tin nhắn tùy theo loại (chỉ text và image)
        if (message.type === "text") {
          contentCell.appendChild(document.createTextNode(message.content));
        } else if (message.type === "image") {
          const imageGrid = document.createElement("div");
          imageGrid.className = "image-grid drop-target";

          // Drop target events cho grid
          imageGrid.addEventListener("dragover", handleDragOver);
          imageGrid.addEventListener("dragleave", handleDragLeave);
          imageGrid.addEventListener("drop", handleDrop);

          message.content.forEach((img, imgIndex) => {
            const imageItem = document.createElement("div");
            imageItem.className = "image-item dragable";
            imageItem.draggable = true;
            imageItem.setAttribute("data-image-id", img.id);
            imageItem.setAttribute("data-image-preview", img.preview_url);
            imageItem.setAttribute("data-source-group", groupIndex);
            imageItem.setAttribute("data-source-message", messageIndex);
            imageItem.setAttribute("data-image-index", imgIndex);

            const image = document.createElement("img");
            image.className = "image-preview";
            image.src = img.preview_url;
            image.alt = "Image";

            const imageId = document.createElement("div");
            imageId.className = "image-id";
            imageId.textContent = img.id;

            // Drag events
            imageItem.addEventListener("dragstart", handleDragStart);
            imageItem.addEventListener("dragend", handleDragEnd);

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

    errorMessageTableElement.appendChild(table);
  }

  // Sự kiện click nút xuất dữ liệu tải xuống
  exportDownloadsButton.addEventListener("click", async function () {
    if (DownloadedImageSchema.clients.length === 0) {
      statusElement.style.display = "block";
      statusElement.textContent = "Chưa có dữ liệu tải xuống nào.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    const jsonString = JSON.stringify(DownloadedImageSchema, null, 2);

    try {
      const method = await copyToClipboard(jsonString);

      statusElement.style.display = "block";
      statusElement.style.backgroundColor = "#e8f5e9";
      statusElement.style.color = "#388e3c";

      if (method === "download") {
        statusElement.textContent =
          "Dữ liệu tải xuống đã được tải xuống dưới dạng file JSON!";
      } else {
        statusElement.textContent = `Đã sao chép dữ liệu tải xuống vào clipboard! (${method})`;
      }

      setTimeout(function () {
        statusElement.style.display = "none";
      }, 3000);
    } catch (err) {
      statusElement.style.display = "block";
      statusElement.textContent = "Không thể sao chép dữ liệu: " + err.message;
      statusElement.style.backgroundColor = "#ffebee";
      statusElement.style.color = "#d32f2f";
    }
  });

  // Hàm hiển thị dữ liệu tải xuống
  function displayDownloadsData() {
    // Xóa nội dung cũ
    downloadsTableElement.innerHTML = "";

    // Kiểm tra xem có dữ liệu không
    if (DownloadedImageSchema.clients.length === 0) {
      const noDataMessage = document.createElement("div");
      noDataMessage.className = "no-data-message";
      noDataMessage.textContent = "Chưa có dữ liệu tải xuống nào.";
      downloadsTableElement.appendChild(noDataMessage);
      return;
    }

    // Tạo bảng
    const table = document.createElement("table");
    table.className = "downloads-table";

    // Tạo header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headerText = document.createElement("th");
    headerText.textContent = "Nội dung văn bản";
    headerRow.appendChild(headerText);

    const headerImages = document.createElement("th");
    headerImages.textContent = "Tên file hình ảnh";
    headerRow.appendChild(headerImages);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Tạo body
    const tbody = document.createElement("tbody");

    DownloadedImageSchema.clients.forEach((client) => {
      const row = document.createElement("tr");

      const textCell = document.createElement("td");
      textCell.className = "client-text";
      textCell.textContent = client.text || "(Không có nội dung)";
      row.appendChild(textCell);

      const imagesCell = document.createElement("td");
      imagesCell.className = "image-names";

      if (client.image_names && client.image_names.length > 0) {
        const imageList = document.createElement("ul");
        client.image_names.forEach((imageName) => {
          const imageItem = document.createElement("li");
          imageItem.textContent = imageName;
          imageList.appendChild(imageItem);
        });
        imagesCell.appendChild(imageList);
      } else {
        imagesCell.textContent = "(Chưa có hình ảnh nào được tải xuống)";
      }

      row.appendChild(imagesCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    downloadsTableElement.appendChild(table);
  }

  // Lắng nghe sự kiện từ background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle download messages
    if (
      message.action === "DOWNLOAD_CREATED" ||
      message.action === "DOWNLOAD_COMPLETED"
    ) {
      console.log(
        `Nhận thông tin tải xuống: ${message.action}`,
        message.downloadItem
      );
      const downloadItem = message.downloadItem;

      // Kiểm tra xem có filename không
      if (!downloadItem.filename) {
        console.log("Bỏ qua thông tin tải xuống vì không có tên file");
        sendResponse({ success: false, reason: "Không có tên file" });
        return true;
      }

      // Kiểm tra xem đã xử lý tải xuống này chưa
      const downloadKey = `${downloadItem.id}-${downloadItem.filename}`;
      if (processedDownloads.has(downloadKey)) {
        console.log(`Đã xử lý tải xuống này rồi: ${downloadKey}`);
        sendResponse({ success: true, alreadyProcessed: true });
        return true;
      }

      // Tìm trong hàng đợi tải xuống xem có imageId nào đang chờ
      if (downloadQueue.length > 0) {
        // Lấy mục tải xuống đầu tiên trong hàng đợi
        // Lưu ý: Không xóa khỏi hàng đợi ở đây, việc xóa sẽ được thực hiện bởi Promise
        const downloadInfo = downloadQueue[0];

        console.log("Liên kết tải xuống với:", downloadInfo);

        // Tìm hoặc tạo client trong schema tải xuống
        let clientIndex = DownloadedImageSchema.clients.findIndex(
          (client) => client.text === downloadInfo.clientText
        );

        if (clientIndex === -1) {
          // Tạo client mới nếu chưa tồn tại
          DownloadedImageSchema.clients.push({
            text: downloadInfo.clientText,
            image_names: [],
          });
          clientIndex = DownloadedImageSchema.clients.length - 1;
        }

        // Thêm tên file vào danh sách nếu chưa tồn tại
        if (
          !DownloadedImageSchema.clients[clientIndex].image_names.includes(
            downloadItem.filename
          )
        ) {
          DownloadedImageSchema.clients[clientIndex].image_names.push(
            downloadItem.filename
          );
        }

        // Đánh dấu là đã xử lý
        processedDownloads.add(downloadKey);

        // Hiển thị thông báo
        statusElement.style.display = "block";
        statusElement.textContent = `Đã tải xuống: ${downloadItem.filename} cho "${downloadInfo.clientText}"`;
        statusElement.style.backgroundColor = "#e8f5e9";
        statusElement.style.color = "#388e3c";

        // Cập nhật hiển thị tab tải xuống nếu đang mở
        const activeTab = document
          .querySelector(".tab.active")
          .getAttribute("data-tab");
        if (activeTab === "downloads") {
          displayDownloadsData();
        }
      } else {
        console.log("Không tìm thấy thông tin trong hàng đợi tải xuống");
      }

      sendResponse({ success: true });
      return true;
    }

    // Handle native messaging responses
    if (message.action === "FROM_ELECTRON") {
      console.log(
        "Received message from Electron via native messaging:",
        message.data
      );

      // Add to native log if native tab is active
      const activeTab = document.querySelector(".tab.active");
      if (activeTab && activeTab.getAttribute("data-tab") === "native") {
        addNativeLogEntry("received", "From Electron", message.data);
        nativeMessageCount.received++;
        updateNativeStatus();
      }

      sendResponse({ success: true, received: true });
      return true;
    }

    return true;
  });

  // Lắng nghe sự kiện từ content script
  window.addEventListener("message", function (event) {
    // Kiểm tra nguồn và loại thông điệp
    if (event.data && event.data.type === "ZALO_DOWNLOAD_FAILED") {
      console.log("Nhận thông báo tải xuống thất bại:", event.data);

      // Xóa khỏi hàng đợi
      downloadQueue = downloadQueue.filter(
        (item) => item.imageId !== event.data.imageId
      );
      console.log("Đã xóa khỏi hàng đợi tải xuống:", event.data.imageId);
    }
  });

  // Xử lý chuyển đổi tab
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      // Lưu lại tab đang active trước khi thay đổi
      let previousActiveTabId = "table"; // Mặc định là tab dữ liệu hợp lệ
      const previousActiveTab = document.querySelector(".tab.active");
      if (previousActiveTab) {
        previousActiveTabId = previousActiveTab.getAttribute("data-tab");
      }

      // Xóa class active từ tất cả các tab
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Thêm class active cho tab được chọn
      this.classList.add("active");
      document.getElementById(tabId + "View").classList.add("active");

      // Cập nhật hiển thị dữ liệu theo tab được chọn
      if (tabId === "json") {
        // Nếu đang chuyển sang tab JSON
        // Hiển thị dữ liệu từ tab trước đó hoặc dữ liệu mặc định
        if (previousActiveTabId === "table") {
          // Từ tab "Dữ liệu hợp lệ" - hiển thị dữ liệu đã chuyển đổi hoặc raw data
          if (convertedDataSchema.clients.length > 0) {
            displayJsonData(convertedDataSchema);
          } else {
            displayJsonData(messageSchema);
          }
        } else if (previousActiveTabId === "error") {
          // Từ tab "Dữ liệu lỗi" - hiển thị error data
          displayJsonData(errorMessageSchema);
        } else if (previousActiveTabId === "downloads") {
          // Từ tab "Tải xuống" - hiển thị download data
          displayJsonData(DownloadedImageSchema);
        } else if (previousActiveTabId === "native") {
          // Từ tab "Native" - hiển thị dữ liệu mặc định
          if (convertedDataSchema.clients.length > 0) {
            displayJsonData(convertedDataSchema);
          } else {
            displayJsonData(messageSchema);
          }
        } else {
          // Mặc định - hiển thị dữ liệu crawl chính
          if (convertedDataSchema.clients.length > 0) {
            displayJsonData(convertedDataSchema);
          } else {
            displayJsonData(messageSchema);
          }
        }
      } else if (tabId === "downloads") {
        // Hiển thị dữ liệu tải xuống
        displayDownloadsData();
      } else if (tabId === "native") {
        // Khởi tạo Native Messaging tab
        initNativeMessagingTab();
      }
    });
  });

  // Native Messaging functionality
  let nativeMessageCount = { sent: 0, received: 0 };
  let nativeConnectionStatus = "Chưa kiểm tra";

  function initNativeMessagingTab() {
    // Cập nhật status display
    updateNativeStatus();

    // Bind event listeners cho native messaging controls
    const testConnectionBtn = document.getElementById("testConnection");
    const clearLogBtn = document.getElementById("clearNativeLog");

    if (testConnectionBtn && !testConnectionBtn.hasAttribute("data-bound")) {
      testConnectionBtn.setAttribute("data-bound", "true");
      testConnectionBtn.addEventListener("click", testNativeConnection);
    }

    if (clearLogBtn && !clearLogBtn.hasAttribute("data-bound")) {
      clearLogBtn.setAttribute("data-bound", "true");
      clearLogBtn.addEventListener("click", clearNativeLog);
    }
  }

  function updateNativeStatus() {
    const connectionStatusEl = document.getElementById("connectionStatus");
    const messagesSentEl = document.getElementById("messagesSent");
    const messagesReceivedEl = document.getElementById("messagesReceived");

    if (connectionStatusEl) {
      connectionStatusEl.textContent = nativeConnectionStatus;
      connectionStatusEl.className = "status-value";

      if (nativeConnectionStatus.includes("Kết nối thành công")) {
        connectionStatusEl.style.background = "#e8f5e9";
        connectionStatusEl.style.color = "#388e3c";
      } else if (nativeConnectionStatus.includes("Lỗi")) {
        connectionStatusEl.style.background = "#ffebee";
        connectionStatusEl.style.color = "#d32f2f";
      } else {
        connectionStatusEl.style.background = "#e3f2fd";
        connectionStatusEl.style.color = "#1976d2";
      }
    }

    if (messagesSentEl) {
      messagesSentEl.textContent = nativeMessageCount.sent;
    }

    if (messagesReceivedEl) {
      messagesReceivedEl.textContent = nativeMessageCount.received;
    }
  }

  function testNativeConnection() {
    const testBtn = document.getElementById("testConnection");
    const originalText = testBtn.textContent;

    testBtn.textContent = "Đang test...";
    testBtn.disabled = true;
    nativeConnectionStatus = "Đang kiểm tra...";
    updateNativeStatus();

    const testMessage = {
      action: "TEST_NATIVE_CONNECTION",
      timestamp: Date.now(),
      source: "extension_panel_native_tab",
      message: "Test kết nối Native Messaging từ Panel! 🔧",
      data: {
        testType: "native_messaging_test",
        panelTab: "native",
        testId: Math.floor(Math.random() * 10000),
      },
    };

    addNativeLogEntry("sent", "Test Connection", testMessage);
    nativeMessageCount.sent++;

    chrome.runtime.sendMessage(
      {
        action: "SEND_TO_ELECTRON",
        data: testMessage,
      },
      (response) => {
        setTimeout(() => {
          testBtn.disabled = false;
          testBtn.textContent = originalText;

          if (response && response.success) {
            nativeConnectionStatus = "Kết nối thành công ✅";
            addNativeLogEntry("received", "Connection Success", response);
            nativeMessageCount.received++;
          } else {
            nativeConnectionStatus = "Lỗi kết nối ❌";
            addNativeLogEntry(
              "error",
              "Connection Failed",
              response || { error: "No response" }
            );
          }

          updateNativeStatus();
        }, 1000);
      }
    );
  }

  function clearNativeLog() {
    const logContainer = document.getElementById("nativeMessageLog");
    if (logContainer) {
      logContainer.innerHTML =
        '<p class="log-empty">Chưa có tin nhắn nào...</p>';
    }

    // Reset counters
    nativeMessageCount = { sent: 0, received: 0 };
    nativeConnectionStatus = "Đã xóa log";
    updateNativeStatus();

    setTimeout(() => {
      nativeConnectionStatus = "Chưa kiểm tra";
      updateNativeStatus();
    }, 2000);
  }

  function addNativeLogEntry(type, title, data) {
    const logContainer = document.getElementById("nativeMessageLog");
    if (!logContainer) return;

    // Remove empty message if exists
    const emptyMsg = logContainer.querySelector(".log-empty");
    if (emptyMsg) {
      emptyMsg.remove();
    }

    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;

    const timestamp = new Date().toLocaleTimeString();
    const content =
      typeof data === "object" ? JSON.stringify(data, null, 2) : data;

    entry.innerHTML = `
      <div class="log-timestamp">[${timestamp}] ${title}</div>
      <div class="log-content">${content}</div>
    `;

    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Quick Fix Functions
  function autoFixGroup(groupIndex) {
    const group = errorMessageSchema.conversations[groupIndex];
    if (!group) return;

    const messages = group.messages;
    console.log("🤖 Auto-fixing group:", group.sender, messages);

    // Strategy 1: Merge same type messages
    const textMessages = messages.filter((m) => m.type === "text");
    const imageMessages = messages.filter((m) => m.type === "image");

    if (textMessages.length > 1) {
      // Merge all text messages
      const mergedText = textMessages.map((m) => m.content).join(" ");
      group.messages = group.messages.filter((m) => m.type !== "text");
      group.messages.unshift({ type: "text", content: mergedText });
    }

    if (imageMessages.length > 1) {
      // Merge all image messages
      const mergedImages = [];
      imageMessages.forEach((m) => {
        mergedImages.push(...m.content);
      });
      group.messages = group.messages.filter((m) => m.type !== "image");
      group.messages.push({ type: "image", content: mergedImages });
    }

    // Re-validate after auto-fix
    const newTotal = group.messages.length;
    if (newTotal % 2 === 0 && newTotal > 0) {
      // Move to valid if fixed
      moveToValidGroup(groupIndex);
    } else {
      // Re-display if still invalid
      displayErrorTableData(errorMessageSchema.conversations);
      statusElement.style.display = "block";
      statusElement.textContent = `🤖 Auto-fix hoàn tất nhưng vẫn còn lỗi (${newTotal} tin nhắn)`;
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      setTimeout(() => (statusElement.style.display = "none"), 3000);
    }
  }

  function deleteErrorGroup(groupIndex) {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ nhóm này?")) return;

    errorMessageSchema.conversations.splice(groupIndex, 1);
    displayErrorTableData(errorMessageSchema.conversations);

    statusElement.style.display = "block";
    statusElement.textContent = "🗑️ Đã xóa nhóm lỗi thành công";
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";
    setTimeout(() => (statusElement.style.display = "none"), 2000);
  }

  function forceValidGroup(groupIndex) {
    if (
      !confirm(
        "Bạn có chắc chắn muốn chuyển nhóm này sang dữ liệu hợp lệ? (Bỏ qua validation)"
      )
    )
      return;

    moveToValidGroup(groupIndex);
  }

  function moveToValidGroup(groupIndex) {
    const group = errorMessageSchema.conversations[groupIndex];
    if (!group) return;

    // Remove from error schema
    errorMessageSchema.conversations.splice(groupIndex, 1);

    // Add to valid schema
    messageSchema.conversations.push(JSON.parse(JSON.stringify(group)));

    // Refresh both displays
    displayErrorTableData(errorMessageSchema.conversations);
    const checkResults = checkChatData(messageSchema.conversations);
    displayTableData(messageSchema.conversations, checkResults);

    statusElement.style.display = "block";
    statusElement.textContent = `✅ Đã chuyển nhóm "${group.sender}" sang dữ liệu hợp lệ`;
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";
    setTimeout(() => (statusElement.style.display = "none"), 3000);
  }
});
