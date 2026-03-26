let ragContainer = null;
let isDragging = false;
let startX, startY, initialX, initialY;

// --- 1. Logic Kéo thả (Giúp Toolbar linh hoạt hơn) ---
function initDraggable(handle, element) {
    handle.onmousedown = (e) => {
        // Không cho kéo nếu đang bấm vào input hoặc nút đóng
        if (["INPUT", "BUTTON"].includes(e.target.tagName) || e.target.classList.contains('rag-close')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;
        
        document.onmousemove = (e) => {
            if (!isDragging) return;
            element.style.left = `${initialX + (e.clientX - startX)}px`;
            element.style.top = `${initialY + (e.clientY - startY)}px`;
        };
        
        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
        };
    };
}

// --- 2. Lắng nghe sự kiện bôi đen ---
document.addEventListener("mouseup", (event) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 1) {
        if (ragContainer && ragContainer.contains(event.target)) return;
        createActionBar(event.pageX, event.pageY, selectedText);
    }
});

// --- 3. Tạo Action Bar (2 tool ngang hàng) ---
function createActionBar(x, y, text) {
    destroyFloatingUI();

    ragContainer = document.createElement("div");
    ragContainer.id = "rag-translator-wrapper";
    ragContainer.style.top = `${y + 12}px`;
    ragContainer.style.left = `${x + 10}px`;

    // Bỏ class 'primary' để 2 nút trông cân bằng nhau
    ragContainer.innerHTML = `
        <div class="rag-action-bar" id="rag-bar-handle">
            <button class="rag-tool-btn" id="rag-btn-translate">🌐 Dịch AI</button>
            <div style="width:1px; height:18px; background:#eee; align-self:center;"></div>
            <button class="rag-tool-btn" id="rag-btn-ask">💡 Hỏi AI</button>
            <div class="rag-close" id="rag-mini-close" style="margin-left:5px; font-size:12px; cursor:pointer;">✕</div>
        </div>
    `;

    document.body.appendChild(ragContainer);

    // Kích hoạt kéo thả cho thanh Bar
    initDraggable(document.getElementById("rag-bar-handle"), ragContainer);

    document.getElementById("rag-btn-translate").onclick = () => triggerAction(text, "translate");
    document.getElementById("rag-btn-ask").onclick = () => expandAskUI(text);
    document.getElementById("rag-mini-close").onclick = destroyFloatingUI;
}

// --- 4. Ô nhập liệu cho "Ask" ---
function expandAskUI(text) {
    const bar = ragContainer.querySelector(".rag-action-bar");
    bar.style.padding = "8px 12px";
    bar.innerHTML = `
        <div class="rag-ask-input-container">
            <input type="text" id="rag-ask-field" class="rag-ask-field" placeholder="Hỏi Gemini về đoạn này...">
            <div style="display:flex; justify-content: flex-end; margin-top: 6px; gap: 10px;">
                <span id="rag-ask-cancel" style="font-size:11px; color:#999; cursor:pointer; align-self:center;">Hủy</span>
                <button id="rag-send-ask" style="font-size:11px; color:#1a73e8; border:none; background:none; cursor:pointer; font-weight:bold;">Gửi ➔</button>
            </div>
        </div>
    `;

    const input = document.getElementById("rag-ask-field");
    input.focus();

    // Quay lại thanh bar ban đầu nếu bấm Hủy
    document.getElementById("rag-ask-cancel").onclick = () => createActionBar(ragContainer.offsetLeft, ragContainer.offsetTop - 12, text);

    const handleSend = () => {
        const question = input.value.trim();
        if (question) triggerAction(text, "ask", question);
    };

    input.onkeydown = (e) => { if (e.key === "Enter") handleSend(); };
    document.getElementById("rag-send-ask").onclick = handleSend;
}

// --- 5. Hàm gọi API chung ---
async function triggerAction(text, type, question = "") {
    ragContainer.innerHTML = `
        <div class="rag-result-box">
            <div class="rag-header" id="rag-result-handle">
                <span>${type === "translate" ? "✨ DỊCH AI (RAG)" : "🤖 TRẢ LỜI (RAG)"}</span>
                <div class="rag-close" id="rag-close-btn">✕</div>
            </div>
            <div class="rag-body">
                <div class="rag-loading">
                    <div class="spinner"></div>
                    <span>Gemini đang xử lý...</span>
                </div>
            </div>
        </div>
    `;
    
    // Kích hoạt kéo thả cho hộp kết quả
    initDraggable(document.getElementById("rag-result-handle"), ragContainer);
    document.getElementById("rag-close-btn").onclick = destroyFloatingUI;

    chrome.runtime.sendMessage({
        type: "API_CALL",
        url: `http://localhost:8080/api/v1/${type}`,
        data: {
            url: window.location.href,
            highlighted_text: text,
            user_question: question
        }
    }, (response) => {
        if (response && response.success) {
            const data = response.data;
            const content = data.answer || data.translation;
            
            ragContainer.querySelector(".rag-body").innerText = content;
            
            // Thêm footer copy
            const footer = document.createElement("div");
            footer.className = "rag-footer";
            footer.innerHTML = `<button class="rag-copy-btn" id="rag-copy-btn">📋 Copy kết quả</button>`;
            ragContainer.querySelector(".rag-result-box").appendChild(footer);

            const copyBtn = document.getElementById("rag-copy-btn");
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = "✅ Đã Copy!";
                setTimeout(() => { copyBtn.innerHTML = "📋 Copy kết quả"; }, 2000);
            };
        } else {
            showError("Lỗi kết nối AI. Kiểm tra Backend!");
        }
    });
}

function destroyFloatingUI() {
    if (ragContainer) {
        ragContainer.remove();
        ragContainer = null;
    }
}

function showError(msg) {
    if (!ragContainer) return;
    ragContainer.innerHTML = `<div class="rag-result-box"><div class="rag-body" style="color:#d93025;">${msg}</div></div>`;
    setTimeout(destroyFloatingUI, 3000);
}

document.addEventListener("mousedown", (event) => {
    if (ragContainer && !ragContainer.contains(event.target)) {
        destroyFloatingUI();
    }
});