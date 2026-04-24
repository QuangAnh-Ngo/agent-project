let ragContainer = null;
let isDragging = false;
let startX, startY, initialX, initialY;
let isPageAuthorized = false;

// ==========================================
// 1. LOGIC KIỂM TRA & NẠP DỮ LIỆU (GIỮ NGUYÊN)
// ==========================================

window.addEventListener("load", async () => {
    const currentUrl = window.location.href;
    chrome.runtime.sendMessage({
        type: "API_CALL",
        method: "GET",
        url: `http://localhost:8080/api/v1/check-url?url=${encodeURIComponent(currentUrl)}`
    }, (response) => {
        if (response && response.success) {
            if (response.data.exists) {
                chrome.storage.local.get([currentUrl], (result) => {
                    if (result[currentUrl] === "OFF") {
                        isPageAuthorized = false;
                        createGhostDock();
                    } else {
                        isPageAuthorized = true;
                    }
                });
            } else {
                showIngestInvitation();
            }
        }
    });
});

function showIngestInvitation() {
    const toast = document.createElement("div");
    toast.id = "rag-ingest-toast";
    toast.innerHTML = `
        <div class="rag-toast-content">
            <div class="rag-toast-header">✨ Chào Thai, trang web mới!</div>
            <div class="rag-toast-body">Bạn có muốn mình "đọc hiểu" trang này để hỗ trợ dịch thuật và trả lời câu hỏi không?</div>
            <div class="rag-toast-actions">
                <button id="rag-ingest-ignore" class="rag-toast-btn-link">Bỏ qua</button>
                <button id="rag-ingest-confirm" class="rag-toast-btn-main">Đồng ý nạp</button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    document.getElementById("rag-ingest-ignore").onclick = () => toast.remove();
    document.getElementById("rag-ingest-confirm").onclick = () => {
        const confirmBtn = document.getElementById("rag-ingest-confirm");
        confirmBtn.innerText = "⏳ Đang đọc...";
        confirmBtn.disabled = true;
        const content = extractPageContent();
        if (content) {
            chrome.runtime.sendMessage({
                type: "API_CALL",
                url: "http://localhost:8080/api/v1/ingest",
                data: { url: window.location.href, content: content }
            }, (res) => {
                if (res && res.success) {
                    isPageAuthorized = true;
                    toast.innerHTML = `<div class="rag-toast-header">✅ Đã xong! Mình đã sẵn sàng hỗ trợ.</div>`;
                    setTimeout(() => toast.remove(), 2000);
                }
            });
        }
    };
}

function extractPageContent() {
    const selectors = "p, h1, h2, h3, h4, h5, h6, li, span";
    const elements = document.querySelectorAll(selectors);
    let cleanedText = "";
    elements.forEach(el => {
        const text = el.innerText.trim();
        if (text.length > 40) cleanedText += text + " ";
    });
    return cleanedText.length > 100 ? cleanedText : null;
}

// ==========================================
// 2. UI ACTION BAR & KÉO THẢ (GIỮ NGUYÊN)
// ==========================================

function initDraggable(handle, element) {
    handle.onmousedown = (e) => {
        if (["INPUT", "BUTTON"].includes(e.target.tagName) || e.target.classList.contains('rag-close')) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        initialX = element.offsetLeft; initialY = element.offsetTop;
        document.onmousemove = (e) => {
            if (!isDragging) return;
            element.style.left = `${initialX + (e.clientX - startX)}px`;
            element.style.top = `${initialY + (e.clientY - startY)}px`;
        };
        document.onmouseup = () => { isDragging = false; document.onmousemove = null; };
    };
}

document.addEventListener("mouseup", (event) => {
    if (!isPageAuthorized) return;
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 1) {
        if (ragContainer && ragContainer.contains(event.target)) return;
        createActionBar(event.pageX, event.pageY, selectedText);
    }
});

function createActionBar(x, y, text) {
    destroyFloatingUI();
    ragContainer = document.createElement("div");
    ragContainer.id = "rag-translator-wrapper";
    ragContainer.style.top = `${y + 12}px`;
    ragContainer.style.left = `${x + 10}px`;
    ragContainer.innerHTML = `
        <div class="rag-action-bar" id="rag-bar-handle">
            <button class="rag-tool-btn" id="rag-btn-translate">🌐 Dịch AI</button>
            <div class="rag-divider"></div>
            <button class="rag-tool-btn" id="rag-btn-ask">💡 Hỏi AI</button>
            <div class="rag-divider"></div>
            <button class="rag-tool-btn rag-btn-off" id="rag-btn-turn-off">🔌 Tắt</button>
            <div class="rag-close-mini" id="rag-mini-close">✕</div>
        </div>
    `;
    document.body.appendChild(ragContainer);
    initDraggable(document.getElementById("rag-bar-handle"), ragContainer);
    document.getElementById("rag-btn-translate").onclick = () => triggerAction(text, "translate");
    document.getElementById("rag-btn-ask").onclick = () => expandAskUI(text);
    document.getElementById("rag-btn-turn-off").onclick = () => {
        const currentUrl = window.location.href;
        chrome.storage.local.set({ [currentUrl]: "OFF" }, () => {
            isPageAuthorized = false;
            destroyFloatingUI();
            createGhostDock();
        });
    };
    document.getElementById("rag-mini-close").onclick = destroyFloatingUI;
}

function expandAskUI(text) {
    const bar = ragContainer.querySelector(".rag-action-bar");
    bar.innerHTML = `
        <div class="rag-ask-input-container">
            <input type="text" id="rag-ask-field" class="rag-ask-field" placeholder="Hỏi Gemini về đoạn này...">
            <div class="rag-ask-footer">
                <span id="rag-ask-cancel">Hủy</span>
                <button id="rag-send-ask">Gửi ➔</button>
            </div>
        </div>
    `;
    const input = document.getElementById("rag-ask-field");
    input.focus();
    document.getElementById("rag-ask-cancel").onclick = () => createActionBar(ragContainer.offsetLeft, ragContainer.offsetTop - 12, text);
    const handleSend = () => {
        const q = input.value.trim();
        if (q) triggerAction(text, "ask", q);
    };
    input.onkeydown = (e) => { if (e.key === "Enter") handleSend(); };
    document.getElementById("rag-send-ask").onclick = handleSend;
}

// ==========================================
// 3. TASK 4.7: HÀM GỌI API STREAMING (UPDATE QUAN TRỌNG)
// ==========================================

async function triggerAction(text, type, question = "") {
    // 1. Tạo giao diện Box kết quả rỗng
    ragContainer.innerHTML = `
        <div class="rag-result-box">
            <div class="rag-header" id="rag-result-handle">
                <span>${type === "translate" ? "✨ AI ĐANG DỊCH..." : "🤖 AI ĐANG TRẢ LỜI..."}</span>
                <div class="rag-close" id="rag-close-btn">✕</div>
            </div>
            <div class="rag-body" id="rag-stream-body">
                <div class="rag-loading-stream">⏳ Đang kết nối...</div>
            </div>
        </div>
    `;
    
    const bodyDisplay = document.getElementById("rag-stream-body");
    initDraggable(document.getElementById("rag-result-handle"), ragContainer);
    document.getElementById("rag-close-btn").onclick = destroyFloatingUI;

    // 2. Mở đường ống dẫn (Port) tới background.js
    const port = chrome.runtime.connect({ name: "AI_STREAM_PORT" });

    // 3. Gửi yêu cầu bắt đầu Stream qua đường ống
    port.postMessage({
        url: `http://localhost:8080/api/v1/${type}`,
        data: { 
            url: window.location.href, 
            highlighted_text: text, 
            user_question: question 
        }
    });

    let fullContent = ""; // Biến lưu toàn bộ nội dung để phục vụ nút Copy

    // 4. Lắng nghe từng mẩu chữ đổ về từ Background
    port.onMessage.addListener((msg) => {
        if (msg.type === "CHUNK") {
            // Xóa dòng "Đang kết nối" ở mảnh chữ đầu tiên
            if (fullContent === "") bodyDisplay.innerText = "";
            
            fullContent += msg.content;
            bodyDisplay.innerText = fullContent; // Nhảy chữ lên màn hình
            
            // Tự động cuộn xuống dưới cùng khi chữ dài ra
            bodyDisplay.scrollTop = bodyDisplay.scrollHeight;
            
        } else if (msg.type === "DONE") {
            // Đổi Header khi xong
            ragContainer.querySelector(".rag-header span").innerText = 
                type === "translate" ? "✅ BẢN DỊCH HOÀN TẤT" : "✅ TRẢ LỜI XONG";
            
            // Thêm nút Copy vào cuối
            addCopyButton(fullContent);
            
        } else if (msg.type === "ERROR") {
            showError(`Lỗi: ${msg.message}`);
        }
    });
}

// Hàm phụ để thêm nút copy sau khi stream xong
function addCopyButton(content) {
    const footer = document.createElement("div");
    footer.className = "rag-footer";
    footer.innerHTML = `<button class="rag-copy-btn" id="rag-copy-btn">📋 Copy kết quả</button>`;
    ragContainer.querySelector(".rag-result-box").appendChild(footer);

    document.getElementById("rag-copy-btn").onclick = function() {
        navigator.clipboard.writeText(content);
        this.innerHTML = "✅ Đã Copy!";
        setTimeout(() => { this.innerHTML = "📋 Copy kết quả"; }, 2000);
    };
}

// ==========================================
// 4. UTILS & UI HỒI SINH (GIỮ NGUYÊN)
// ==========================================

function destroyFloatingUI() {
    if (ragContainer) { ragContainer.remove(); ragContainer = null; }
}

function showError(msg) {
    if (!ragContainer) return;
    ragContainer.innerHTML = `<div class="rag-result-box"><div class="rag-body" style="color:#d93025;">${msg}</div></div>`;
    setTimeout(destroyFloatingUI, 3000);
}

document.addEventListener("mousedown", (event) => {
    if (ragContainer && !ragContainer.contains(event.target)) destroyFloatingUI();
});

function createGhostDock() {
    const existingDock = document.getElementById("rag-ghost-dock");
    if (existingDock) existingDock.remove();
    const dock = document.createElement("div");
    dock.id = "rag-ghost-dock";
    dock.innerHTML = `
        <div class="rag-ghost-content">
            <span class="rag-ghost-icon">📄</span>
            <span class="rag-ghost-text">AI đã đọc trang này. Bạn có muốn sử dụng?</span>
            <button class="rag-ghost-btn-reactivate" id="rag-ghost-reactivate">💡 Kích hoạt</button>
        </div>
    `;
    document.body.appendChild(dock);
    document.getElementById("rag-ghost-reactivate").onclick = () => {
        const currentUrl = window.location.href;
        chrome.storage.local.remove([currentUrl], () => {
            isPageAuthorized = true;
            const dock = document.getElementById("rag-ghost-dock");
            if (dock) dock.remove();
            console.log("⚡ AI đã được kích hoạt trở lại!");
        });
    };
}