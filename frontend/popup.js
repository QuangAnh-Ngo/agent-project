// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-btn');
    
    testBtn.addEventListener('click', () => {
        // for ping BE
        testBtn.textContent = "Kết nối thành công!";
        testBtn.style.background = "#28a745";
    });
});