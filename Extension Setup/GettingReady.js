// 🚀 Zalo Crawler - Getting Ready System
// Hệ thống chuẩn bị và đánh dấu target crawl độc lập

class ZaloCrawlerGettingReady {
  constructor() {
    this.isScrolling = false;
    this.scrollInterval = null;
    this.scrollSpeed = 1000; // 1 giây
    this.foundBlocks = [];
    this.popup = null;

    this.init();
  }

  init() {
    this.createPopup();
    this.showPopup();
  }

  createPopup() {
    // Tạo popup overlay
    const overlay = document.createElement("div");
    overlay.id = "vx-crawler-popup-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    `;

    // Tạo popup container
    const popup = document.createElement("div");
    popup.id = "vx-crawler-popup";
    popup.style.cssText = `
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 30px;
      max-width: 450px;
      width: 90%;
      text-align: center;
      position: relative;
      animation: vx-popup-slide-in 0.3s ease-out;
    `;

    // CSS Animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes vx-popup-slide-in {
        from {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .vx-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: vx-spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
      }
      
      @keyframes vx-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Nội dung popup
    popup.innerHTML = `
      <div style="margin-bottom: 20px;">
        <lord-icon src="https://cdn.lordicon.com/lupuorrc.json" trigger="loop" colors="primary:#007bff,secondary:#28a745" style="width:64px;height:64px;"></lord-icon>
      </div>
      
      <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px; font-weight: 600;">
        🎯 Zalo Crawler Setup
      </h2>
      
      <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.5;">
        Chuẩn bị crawl dữ liệu Zalo.<br>
        Chọn phương thức để bắt đầu:
      </p>
      
      <div id="vx-main-buttons" style="display: flex; gap: 15px; margin-bottom: 20px;">
        <button id="vx-btn-auto-scroll" style="
          flex: 1;
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          border: none;
          padding: 15px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          📜 Tự động cuộn
        </button>
        
        <button id="vx-btn-check-now" style="
          flex: 1;
          background: linear-gradient(135deg, #28a745, #1e7e34);
          color: white;
          border: none;
          padding: 15px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          🔍 Kiểm tra
        </button>
      </div>
      
      <div id="vx-scroll-controls" style="display: none; margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
          <div class="vx-spinner"></div>
          <span style="color: #007bff; font-weight: 600;">Đang cuộn tự động...</span>
        </div>
        <button id="vx-btn-stop" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          ⏹️ Dừng cuộn
        </button>
      </div>
      
      <div id="vx-date-selector" style="display: none;">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
          📅 Chọn ngày để crawl:
        </h3>
        <div id="vx-date-dropdown" style="margin-bottom: 15px;">
          <!-- Dropdown sẽ được tạo động -->
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="vx-btn-confirm-date" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
            ✅ Xác nhận
          </button>
          <button id="vx-btn-continue-scroll" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
            📜 Cuộn tiếp
          </button>
        </div>
      </div>
      
      <button id="vx-btn-skip" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: transparent;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">
        ×
      </button>
    `;

    overlay.appendChild(popup);
    this.popup = overlay;

    // Bind events
    this.bindEvents();
  }

  bindEvents() {
    const popup = this.popup;

    // Skip button
    popup.querySelector("#vx-btn-skip").addEventListener("click", () => {
      this.hidePopup();
    });

    // Auto scroll button
    popup.querySelector("#vx-btn-auto-scroll").addEventListener("click", () => {
      this.startAutoScroll();
    });

    // Check now button
    popup.querySelector("#vx-btn-check-now").addEventListener("click", () => {
      this.checkBlockDates();
    });

    // Stop button
    popup.querySelector("#vx-btn-stop").addEventListener("click", () => {
      this.stopAutoScroll();
    });

    // Confirm date button
    popup
      .querySelector("#vx-btn-confirm-date")
      .addEventListener("click", () => {
        this.confirmSelectedDate();
      });

    // Continue scroll button
    popup
      .querySelector("#vx-btn-continue-scroll")
      .addEventListener("click", () => {
        this.hideDropdownShowScroll();
      });

    // Click outside to close
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        this.hidePopup();
      }
    });
  }

  showPopup() {
    document.body.appendChild(this.popup);
  }

  hidePopup() {
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    this.stopAutoScroll(); // Đảm bảo dừng cuộn khi đóng popup
  }

  startAutoScroll() {
    if (this.isScrolling) return;

    this.isScrolling = true;

    // Hiển thị controls cuộn
    this.popup.querySelector("#vx-main-buttons").style.display = "none";
    this.popup.querySelector("#vx-scroll-controls").style.display = "block";

    console.log("🚀 Bắt đầu tự động cuộn...");

    // Tìm container cuộn
    const scrollContainer = document.querySelector(".transform-gpu");
    if (!scrollContainer) {
      alert("Không tìm thấy container cuộn (.transform-gpu)");
      this.resetToMainButtons();
      return;
    }

    // Bắt đầu interval cuộn
    this.scrollInterval = setInterval(() => {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      console.log("📜 Cuộn lên top...");
    }, this.scrollSpeed);
  }

  stopAutoScroll() {
    if (!this.isScrolling) return;

    console.log("⏹️ Dừng tự động cuộn");

    this.isScrolling = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    // Tìm tất cả block-date sau khi dừng
    this.checkBlockDates();
  }

  checkBlockDates() {
    console.log("🔍 Đang tìm các block-date...");

    // Tìm tất cả .block-date
    const blockDates = document.querySelectorAll(".block-date");
    this.foundBlocks = [];

    blockDates.forEach((block, index) => {
      // Tìm timestamp trong block
      const timestampElement = block.querySelector(".--time .content span");
      if (timestampElement) {
        const timestamp =
          timestampElement.innerText || timestampElement.textContent || "";
        this.foundBlocks.push({
          element: block,
          timestamp: timestamp.trim(),
          index: index,
        });
      }
    });

    console.log(
      `📅 Tìm thấy ${this.foundBlocks.length} block-date:`,
      this.foundBlocks.map((b) => b.timestamp)
    );

    if (this.foundBlocks.length === 0) {
      alert("Không tìm thấy block-date nào trong DOM hiện tại");
      this.resetToMainButtons();
      return;
    }

    // Hiển thị dropdown để chọn
    this.showDateSelector();
  }

  showDateSelector() {
    // Ẩn các controls khác
    this.popup.querySelector("#vx-main-buttons").style.display = "none";
    this.popup.querySelector("#vx-scroll-controls").style.display = "none";

    // Hiển thị date selector
    this.popup.querySelector("#vx-date-selector").style.display = "block";

    // Tạo dropdown
    const dropdown = this.popup.querySelector("#vx-date-dropdown");
    dropdown.innerHTML = `
      <select id="vx-select-date" style="
        width: 100%;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
        background: white;
        outline: none;
      ">
        <option value="">-- Chọn ngày --</option>
        ${this.foundBlocks
          .map(
            (block, index) =>
              `<option value="${index}">${block.timestamp} (Block ${
                index + 1
              })</option>`
          )
          .join("")}
      </select>
    `;
  }

  confirmSelectedDate() {
    const select = this.popup.querySelector("#vx-select-date");
    const selectedIndex = select.value;

    if (!selectedIndex && selectedIndex !== "0") {
      alert("Vui lòng chọn một ngày!");
      return;
    }

    const selectedBlock = this.foundBlocks[parseInt(selectedIndex)];

    console.log("✅ Đã chọn block:", selectedBlock.timestamp);

    // 🧹 CLEAR tất cả target cũ trước (nếu có)
    const oldTargets = document.querySelectorAll(".Vx_CrawlerTarget");
    oldTargets.forEach((target) => {
      target.classList.remove("Vx_CrawlerTarget");
      console.log("🗑️ Đã xóa target cũ:", target);
    });

    // ✅ Thêm class Vx_CrawlerTarget vào block đã chọn
    selectedBlock.element.classList.add("Vx_CrawlerTarget");
    console.log("🎯 Đã thêm target mới:", selectedBlock.element);

    // 🎯 SCROLL TO TARGET (có thể comment nếu gặp lỗi)
    try {
      selectedBlock.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Highlight block đã chọn
      selectedBlock.element.style.border = "3px solid #28a745";
      selectedBlock.element.style.backgroundColor = "#e8f5e9";

      setTimeout(() => {
        if (selectedBlock.element.style) {
          selectedBlock.element.style.border = "";
          selectedBlock.element.style.backgroundColor = "";
        }
      }, 3000);
    } catch (error) {
      console.warn("⚠️ Lỗi khi scroll đến target:", error);
      // Vẫn tiếp tục mà không scroll
    }

    // Thông báo thành công
    alert(
      `✅ Đã đánh dấu target crawl: "${selectedBlock.timestamp}"\n\nBây giờ bạn có thể sử dụng chức năng Crawl trong Panel!`
    );

    this.hidePopup();
  }

  hideDropdownShowScroll() {
    // Ẩn date selector
    this.popup.querySelector("#vx-date-selector").style.display = "none";

    // Hiển thị lại scroll controls để tiếp tục cuộn
    this.popup.querySelector("#vx-scroll-controls").style.display = "block";

    // Bắt đầu cuộn lại
    this.startAutoScroll();
  }

  resetToMainButtons() {
    this.popup.querySelector("#vx-main-buttons").style.display = "flex";
    this.popup.querySelector("#vx-scroll-controls").style.display = "none";
    this.popup.querySelector("#vx-date-selector").style.display = "none";
  }
}

// 🚀 Khởi tạo Getting Ready System khi DOM ready
// CHỈ tự động mở popup lần đầu, sau đó dùng nút manual
function autoInitGettingReady() {
  // Kiểm tra xem đã từng mở popup chưa (trong session này)
  if (window.zaloCrawlerGettingReadyShown) {
    console.log(
      "🎯 Getting Ready đã được hiển thị, sử dụng nút manual để mở lại"
    );
    return;
  }

  // Đánh dấu đã hiển thị popup auto
  window.zaloCrawlerGettingReadyShown = true;

  // Tự động mở popup lần đầu
  setTimeout(() => {
    new ZaloCrawlerGettingReady();
  }, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInitGettingReady);
} else {
  autoInitGettingReady();
}
