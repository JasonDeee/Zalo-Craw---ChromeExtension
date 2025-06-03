// Tạo một panel mới trong DevTools
chrome.devtools.panels.create(
  "Zalo Crawler", // tiêu đề hiển thị trên tab
  "LogoWhite.png", // icon của panel
  "panel.html", // trang HTML sẽ được load trong panel
  (panel) => {
    // Callback được gọi khi panel được tạo thành công
    console.log("Panel created successfully");
  }
);
