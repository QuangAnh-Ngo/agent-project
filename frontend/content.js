// file: content.js
// Nơi tương tác trực tiếp với giao diện YouTube (lấy transcript, thao tác video player)
console.log("[Content Script] Đã được tiêm thành công vào trang YouTube!");

// Lắng nghe sự kiện bôi đen text
document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        console.log("[Content Script] Nội dung được bôi đen:", selectedText);
    }
});