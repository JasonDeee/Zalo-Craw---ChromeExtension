const RandomTokenTest = "meag@bhjkdfsxxxx2";

// Biến để lưu trữ thông tin tải xuống
let downloadQueue = [];
let processedDownloads = new Set(); // Lưu trữ ID tải xuống đã xử lý
let currentClientText = "";

// Listen for messages from the extension's background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_RANDOM_TOKEN") {
    // Try to get the token via native messaging
    const nativeHostName = "com.zalocrawler.host";

    // Try to connect to the native host
    try {
      const port = chrome.runtime.connectNative(nativeHostName);

      // Handle messages from the native host
      port.onMessage.addListener((response) => {
        if (response && response.token) {
          sendResponse({ token: response.token });
        } else {
          sendResponse({ token: RandomTokenTest }); // Fallback to local token
        }
      });

      // Handle disconnect
      port.onDisconnect.addListener(() => {
        console.log("Disconnected from native host");
        // Fallback to local token if native messaging fails
        sendResponse({ token: RandomTokenTest });
      });

      // Send the request to the native host
      port.postMessage({ action: "GET_RANDOM_TOKEN" });

      return true; // Keep the message channel open for async response
    } catch (error) {
      console.error("Native host error:", error);
      // Fallback to local token if native messaging is not available
      sendResponse({ token: RandomTokenTest });
      return false;
    }
  }
  return true; // Required for async response
});

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
            downloadSingleImage(img.id, client.text);
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

  // Sự kiện click nút xuất dữ liệu tải xuống
  exportDownloadsButton.addEventListener("click", function () {
    if (DownloadedImageSchema.clients.length === 0) {
      statusElement.style.display = "block";
      statusElement.textContent = "Chưa có dữ liệu tải xuống nào.";
      statusElement.style.backgroundColor = "#fff8e1";
      statusElement.style.color = "#f57c00";
      return;
    }

    const jsonString = JSON.stringify(DownloadedImageSchema, null, 2);
    navigator.clipboard.writeText(jsonString).then(
      function () {
        statusElement.style.display = "block";
        statusElement.textContent =
          "Đã sao chép dữ liệu tải xuống vào clipboard!";
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

  // Lắng nghe sự kiện tải xuống từ background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
        } else if (previousActiveTabId === "downloads") {
          // Nếu chuyển từ tab "Tải xuống" sang
          displayJsonData(DownloadedImageSchema);
        }
      } else if (tabId === "downloads") {
        // Hiển thị dữ liệu tải xuống
        displayDownloadsData();
      }
    });
  });
});
