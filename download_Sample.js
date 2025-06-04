// Điều hướng zalo Focus vào đối tượng cần download thông qua id của đối tượng đó
const target2 = document.getElementById(
  "img-1748999830219.3304295852933752314.g3002843645600913037-MESSAGE_LIST_GROUP_PHOTO"
);
const contextEvent = new MouseEvent("contextmenu", {
  bubbles: true,
  cancelable: true,
  view: window,
});

target2.dispatchEvent(contextEvent); // Khi chuột phải vào đối tượng thì Zalo sẽ hiện Context Menu với option "Tải xuống" ở phần tử thứ 3

// Tạo event click vào phần tử thứ 3 của menu để bắt đầu tải file về. Phần tử thứ 3 là nút "Tải xuống"
const Targets = document.querySelectorAll(
  ".popover-v3 .zmenu-body .zmenu-item"
);
Targets[2].click();
