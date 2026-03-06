console.log("[Content Script] Đã được tiêm thành công vào trang!");

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length === 0) return;
  console.log("[Content Script] Đoạn chữ được bôi đen:", selectedText);
});