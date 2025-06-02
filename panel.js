document.addEventListener("DOMContentLoaded", function () {
  const startCrawlButton = document.getElementById("startCrawl");
  const downloadAllButton = document.getElementById("downloadAll");
  const imageContainer = document.getElementById("imageContainer");

  let collectedImages = [];

  // Sự kiện click nút bắt đầu crawl
  startCrawlButton.addEventListener("click", function () {
    // Reset container
    imageContainer.innerHTML = "";
    collectedImages = [];

    // Gửi message tới content script để crawl ảnh từ trang hiện tại
    chrome.devtools.inspectedWindow.eval(
      `
      // Lấy tất cả các ảnh trên trang
      var images = Array.from(document.querySelectorAll('img')).map(img => {
        return {
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        };
      });
      images;
    `,
      (result, isException) => {
        if (isException) {
          console.error("Error executing script", isException);
          return;
        }

        if (result && Array.isArray(result)) {
          collectedImages = result;
          displayImages(result);
        }
      }
    );
  });

  // Sự kiện click nút tải tất cả ảnh
  downloadAllButton.addEventListener("click", function () {
    if (collectedImages.length === 0) {
      alert("Chưa có ảnh nào để tải xuống!");
      return;
    }

    // Tạo một zip file chứa tất cả ảnh
    // Trong trường hợp thực tế, bạn có thể sử dụng thư viện như JSZip
    // Đây chỉ là mô phỏng tải xuống từng ảnh
    collectedImages.forEach((image, index) => {
      const a = document.createElement("a");
      a.href = image.src;
      a.download = `zalo-image-${index + 1}.jpg`;
      a.click();
    });
  });

  // Hiển thị ảnh đã thu thập trong container
  function displayImages(images) {
    if (images.length === 0) {
      imageContainer.innerHTML = "<p>Không tìm thấy ảnh nào!</p>";
      return;
    }

    images.forEach((image, index) => {
      const imageDiv = document.createElement("div");
      imageDiv.className = "image-item";

      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt || `Image ${index + 1}`;

      const urlText = document.createElement("div");
      urlText.className = "image-url";
      urlText.textContent = image.src;

      imageDiv.appendChild(img);
      imageDiv.appendChild(urlText);
      imageContainer.appendChild(imageDiv);
    });
  }
});
