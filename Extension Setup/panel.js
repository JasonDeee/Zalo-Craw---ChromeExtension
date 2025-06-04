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

const convertedSchema = {
  clients: [
    {
      text: "Hello",
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

document.addEventListener("DOMContentLoaded", function () {
  const startCrawlButton = document.getElementById("startCrawl");
  const resultElement = document.getElementById("result");
  const statusElement = document.getElementById("status");
  const copyDataButton = document.getElementById("copyData");
  const checkDataButton = document.getElementById("checkData");
  const convertDataButton = document.getElementById("convertData");
  const getAllImagesButton = document.getElementById("getAllImages");
  const messageTableElement = document.getElementById("messageTable");
  const errorMessageTableElement = document.getElementById("errorMessageTable");

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
          // Reset dữ liệu cũ
          messageSchema.conversations = [];
          errorMessageSchema.conversations = [];

          // Kiểm tra và phân loại dữ liệu
          classifyData(result);

          // Hiển thị số lượng tin nhắn đã crawl được
          const countMessage = `Đã crawl được ${result.length} nhóm tin nhắn. Có ${messageSchema.conversations.length} nhóm hợp lệ và ${errorMessageSchema.conversations.length} nhóm không hợp lệ.`;
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

          // Lưu dữ liệu vào localStorage để có thể sử dụng sau này
          try {
            chrome.storage.local.set(
              {
                zaloMessages: messageSchema,
                zaloErrorMessages: errorMessageSchema,
              },
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

  // Hàm phân loại dữ liệu
  function classifyData(conversations) {
    conversations.forEach((group) => {
      // Kiểm tra tính hợp lệ của nhóm tin nhắn
      const totalMessages = group.messages.length;
      const imageMessages = group.messages.filter(
        (msg) => msg.type === "image"
      ).length;

      // Điều kiện không hợp lệ: số lượng tin nhắn lẻ hoặc không đủ hình ảnh
      if (totalMessages % 2 !== 0 || imageMessages < totalMessages / 2) {
        // Thêm vào schema lỗi
        errorMessageSchema.conversations.push(
          JSON.parse(JSON.stringify(group))
        );
      } else {
        // Thêm vào schema hợp lệ
        messageSchema.conversations.push(JSON.parse(JSON.stringify(group)));
      }
    });
  }

  // Sự kiện click nút sao chép dữ liệu
  copyDataButton.addEventListener("click", function () {
    // Kiểm tra tab nào đang được hiển thị để quyết định sao chép dữ liệu nào
    const activeTab = document
      .querySelector(".tab.active")
      .getAttribute("data-tab");
    let dataToExport;

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
    } else {
      // Mặc định là dữ liệu hợp lệ
      dataToExport = messageSchema;
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
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

    // Hiển thị thông báo
    statusElement.style.display = "block";
    statusElement.textContent = `Đã kiểm tra ${checkResults.totalGroups} nhóm tin nhắn, phát hiện ${checkResults.problematicGroups} nhóm có vấn đề.`;

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

    // Hiển thị thông báo
    statusElement.style.display = "block";
    statusElement.textContent = `Đã chuyển đổi thành công ${convertedDataSchema.clients.length} nhóm dữ liệu khách hàng.`;
    statusElement.style.backgroundColor = "#e8f5e9";
    statusElement.style.color = "#388e3c";

    // Nếu đang ở tab JSON, cập nhật hiển thị JSON với dữ liệu đã chuyển đổi
    const activeTab = document
      .querySelector(".tab.active")
      .getAttribute("data-tab");
    if (activeTab === "json") {
      displayJsonData(convertedDataSchema);
    }

    // Lưu dữ liệu mới vào storage
    try {
      chrome.storage.local.set(
        {
          zaloMessages: messageSchema,
          zaloErrorMessages: errorMessageSchema,
          zaloConvertedData: convertedDataSchema,
        },
        function () {
          console.log("Dữ liệu đã được cập nhật trong storage");
        }
      );
    } catch (error) {
      console.error("Không thể cập nhật dữ liệu vào storage:", error);
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

    // Tạo script để tải từng hình ảnh
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        // Hàm tải một hình ảnh từ ID
        function downloadImage(imageId) {
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
        
        // Danh sách ID hình ảnh cần tải
        const imageIds = ${JSON.stringify(
          clients.flatMap((client) => client.images.map((img) => img.id))
        )};
        
        // Tải tuần tự từng hình ảnh
        async function downloadSequentially() {
          let successCount = 0;
          let failCount = 0;
          
          for (let i = 0; i < imageIds.length; i++) {
            // Cập nhật trạng thái tải
            console.log("Downloading image " + (i + 1) + "/" + imageIds.length + ": " + imageIds[i]);
            
            const success = await downloadImage(imageIds[i]);
            if (success) {
              successCount++;
            } else {
              failCount++;
            }
            
            // Đợi một chút trước khi tải hình tiếp theo để tránh bị chặn
            await new Promise(resolve => setTimeout(resolve, 250));
          }
          
          return { successCount, failCount };
        }
        
        // Bắt đầu tải
        return downloadSequentially();
      })();
      `,
      (result, isException) => {
        if (isException) {
          console.error("Lỗi khi tải hình ảnh:", isException);
          statusElement.textContent =
            "Lỗi khi tải hình ảnh: " + isException.value;
          statusElement.style.backgroundColor = "#ffebee";
          statusElement.style.color = "#d32f2f";
          return;
        }

        if (result) {
          const { successCount, failCount } = result;
          statusElement.textContent = `Đã tải ${successCount} hình ảnh thành công, ${failCount} hình ảnh thất bại.`;
          statusElement.style.backgroundColor = "#e8f5e9";
          statusElement.style.color = "#388e3c";
        }
      }
    );

    // Hiển thị thông báo đang tải
    let dots = "";
    const loadingInterval = setInterval(() => {
      dots = dots.length >= 3 ? "" : dots + ".";
      statusElement.textContent = `Đang tải hình ảnh${dots} (Quá trình này có thể mất vài phút)`;
    }, 500);

    // Dừng thông báo sau khoảng thời gian ước tính
    setTimeout(() => {
      clearInterval(loadingInterval);
    }, totalImages * 2000); // Ước tính thời gian hoàn thành
  }

  // Hàm chuyển đổi dữ liệu
  function convertData(conversations) {
    // Reset dữ liệu chuyển đổi cũ
    convertedDataSchema.clients = [];

    // Duyệt qua từng nhóm tin nhắn
    conversations.forEach((group) => {
      const messages = group.messages;

      // Xử lý từng cặp tin nhắn liền kề
      for (let i = 0; i < messages.length; i += 2) {
        // Kiểm tra xem còn đủ 2 tin nhắn không
        if (i + 1 < messages.length) {
          const firstMessage = messages[i];
          const secondMessage = messages[i + 1];

          // Tạo đối tượng client mới
          const clientData = {
            text: "",
            images: [],
            error: false,
          };

          // Kiểm tra loại tin nhắn
          if (firstMessage.type === secondMessage.type) {
            // Nếu 2 tin nhắn cùng loại, đánh dấu lỗi
            clientData.error = true;
          }

          // Xử lý tin nhắn đầu tiên
          if (firstMessage.type === "text") {
            clientData.text = firstMessage.content;
          } else if (firstMessage.type === "image") {
            clientData.images = clientData.images.concat(firstMessage.content);
          }

          // Xử lý tin nhắn thứ hai
          if (secondMessage.type === "text") {
            clientData.text = secondMessage.content;
          } else if (secondMessage.type === "image") {
            clientData.images = clientData.images.concat(secondMessage.content);
          }

          // Thêm vào danh sách clients
          convertedDataSchema.clients.push(clientData);
        }
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
        imageGrid.className = "image-grid";

        client.images.forEach((img) => {
          const imageItem = document.createElement("div");
          imageItem.className = "image-item";

          const image = document.createElement("img");
          image.className = "image-preview";
          image.src = img.preview_url;
          image.alt = "Image";

          const imageId = document.createElement("div");
          imageId.className = "image-id";
          imageId.textContent = img.id;

          // Thêm nút tải xuống cho từng hình ảnh
          const downloadButton = document.createElement("div");
          downloadButton.className = "download-image";
          downloadButton.innerHTML = "⬇️"; // Biểu tượng tải xuống
          downloadButton.title = "Tải hình ảnh này";
          downloadButton.addEventListener("click", function () {
            downloadSingleImage(img.id);
          });

          imageItem.appendChild(image);
          imageItem.appendChild(imageId);
          imageItem.appendChild(downloadButton);
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
  function downloadSingleImage(imageId) {
    statusElement.style.display = "block";
    statusElement.textContent = `Đang tải hình ảnh: ${imageId}...`;
    statusElement.style.backgroundColor = "#e3f2fd";
    statusElement.style.color = "#1976d2";

    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        // Hàm tải một hình ảnh từ ID
        function downloadImage(imageId) {
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
          statusElement.textContent =
            "Lỗi khi tải hình ảnh: " + isException.value;
          statusElement.style.backgroundColor = "#ffebee";
          statusElement.style.color = "#d32f2f";
          return;
        }

        if (result === true) {
          statusElement.textContent = "Đã tải hình ảnh thành công!";
          statusElement.style.backgroundColor = "#e8f5e9";
          statusElement.style.color = "#388e3c";

          // Tự động ẩn thông báo sau 3 giây
          setTimeout(() => {
            statusElement.style.display = "none";
          }, 3000);
        } else {
          statusElement.textContent =
            "Không thể tải hình ảnh. Vui lòng thử lại.";
          statusElement.style.backgroundColor = "#fff8e1";
          statusElement.style.color = "#f57c00";
        }
      }
    );
  }

  // Hàm kiểm tra dữ liệu chat
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

      // Đếm số lượng tin nhắn và số lượng tin nhắn hình ảnh
      const totalMessages = group.messages.length;
      const imageMessages = group.messages.filter(
        (msg) => msg.type === "image"
      ).length;
      const textMessages = group.messages.filter(
        (msg) => msg.type === "text"
      ).length;

      // Kiểm tra số lượng tin nhắn là số lẻ
      if (totalMessages % 2 !== 0) {
        isProblematic = true;
        reason = `Số lượng tin nhắn là số lẻ (${totalMessages})`;
      }
      // Kiểm tra số lượng tin nhắn hình ảnh < 50% tổng số tin nhắn khi số tin nhắn là chẵn
      else if (imageMessages < totalMessages / 2) {
        isProblematic = true;
        reason = `Số lượng tin nhắn hình ảnh (${imageMessages}) < 50% tổng số tin nhắn (${totalMessages})`;
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

    // Lưu dữ liệu mới vào storage
    try {
      chrome.storage.local.set(
        {
          zaloMessages: messageSchema,
          zaloErrorMessages: errorMessageSchema,
        },
        function () {
          console.log("Dữ liệu đã được cập nhật trong storage");
        }
      );
    } catch (error) {
      console.error("Không thể cập nhật dữ liệu vào storage:", error);
    }
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

        // Hiển thị nội dung tin nhắn tùy theo loại
        if (message.type === "text") {
          contentCell.appendChild(document.createTextNode(message.content));
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
      let reason = "";

      if (totalMessages % 2 !== 0) {
        reason = `Số lượng tin nhắn là số lẻ (${totalMessages})`;
      } else if (imageMessages < totalMessages / 2) {
        reason = `Số lượng tin nhắn hình ảnh (${imageMessages}) < 50% tổng số tin nhắn (${totalMessages})`;
      }

      const reasonElement = document.createElement("div");
      reasonElement.className = "error-reason";
      reasonElement.textContent = `Lý do: ${reason}`;
      senderCell.appendChild(document.createElement("br"));
      senderCell.appendChild(reasonElement);

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

        // Hiển thị nội dung tin nhắn tùy theo loại
        if (message.type === "text") {
          contentCell.appendChild(document.createTextNode(message.content));
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

    errorMessageTableElement.appendChild(table);
  }

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
        if (previousActiveTabId === "table" || previousActiveTabId === "json") {
          // Nếu chuyển từ tab "Dữ liệu hợp lệ" hoặc đang ở tab JSON
          if (convertedDataSchema.clients.length > 0) {
            displayJsonData(convertedDataSchema);
          } else {
            displayJsonData(messageSchema);
          }
        } else if (previousActiveTabId === "error") {
          // Nếu chuyển từ tab "Dữ liệu lỗi" sang
          displayJsonData(errorMessageSchema);
        }
      }
    });
  });
});
