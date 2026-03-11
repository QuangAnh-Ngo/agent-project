let ragContainer = null;

document.addEventListener("mouseup", (event) => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 1) {
        if (ragContainer && ragContainer.contains(event.target)) return;
        createFloatingUI(event.pageX, event.pageY, selectedText);
    }
});

function createFloatingUI(x, y, text) {
    destroyFloatingUI();

    ragContainer = document.createElement("div");
    ragContainer.id = "rag-translator-wrapper";
    ragContainer.style.top = `${y + 12}px`;
    ragContainer.style.left = `${x + 10}px`;

    const button = document.createElement("button");
    button.className = "rag-action-btn";
    button.innerHTML = "🪄 Dịch AI (RAG)";
    
    ragContainer.appendChild(button);
    document.body.appendChild(ragContainer);

    button.addEventListener("click", () => triggerTranslation(text));
}

async function triggerTranslation(text) {
    ragContainer.innerHTML = `
        <div class="rag-result-box">
            <div class="rag-header">
                <span>Đang phân tích...</span>
                <div class="rag-close" id="rag-close-btn">✖</div>
            </div>
            <div class="rag-body">
                <div class="rag-loading">
                    <div class="spinner"></div>
                    <span>Gemini đang đọc ngữ cảnh bài viết...</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("rag-close-btn").onclick = destroyFloatingUI;

    chrome.runtime.sendMessage({
        type: "API_CALL",
        url: "http://localhost:8080/api/v1/translate",
        data: {
            url: window.location.href,
            highlighted_text: text
        }
    }, (response) => {
        if (response && response.success) {
            const data = response.data;
            ragContainer.innerHTML = `
                <div class="rag-result-box">
                    <div class="rag-header">
                        <span>✨ Bản dịch thông minh (RAG)</span>
                        <div class="rag-close" id="rag-close-btn">✖</div>
                    </div>
                    <div class="rag-body">${data.translation}</div>
                    <div class="rag-footer">
                        <button class="rag-copy-btn" id="rag-copy-btn">📋 Copy bản dịch</button>
                    </div>
                </div>
            `;
            document.getElementById("rag-close-btn").onclick = destroyFloatingUI;
            const copyBtn = document.getElementById("rag-copy-btn");
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(data.translation);
                copyBtn.innerHTML = "✅ Đã Copy!";
                setTimeout(() => { copyBtn.innerHTML = "📋 Copy bản dịch"; }, 2000);
            };
        } else {
            ragContainer.innerHTML = `
                <div class="rag-result-box">
                    <div class="rag-body" style="color: #d93025;">
                        Lỗi kết nối qua Background. Hãy kiểm tra Backend!
                    </div>
                </div>
            `;
            setTimeout(destroyFloatingUI, 3000);
        }
    });
}

function destroyFloatingUI() {
    if (ragContainer) {
        ragContainer.remove();
        ragContainer = null;
    }
}

document.addEventListener("mousedown", (event) => {
    if (ragContainer && !ragContainer.contains(event.target)) {
        destroyFloatingUI();
    }
});

window.addEventListener("load", () => {
    const allParagraphs = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span");
    let cleanedText = "";

    allParagraphs.forEach((element) => {
        const text = element.innerText.trim();
        if (text.length > 30) {
            cleanedText += text + " ";
        }
    });

    if (cleanedText.length > 100) {
        sendDataToBackend(cleanedText);
    }
});

async function sendDataToBackend(content) {
    chrome.runtime.sendMessage({
        type: "API_CALL",
        url: "http://localhost:8080/api/v1/ingest",
        data: {
            url: window.location.href,
            content: content
        }
    }, (response) => {
        if (response && response.success) {
            console.log("🚀 Đã nạp dữ liệu trang web:", response.data.message);
        } else {
            console.error("❌ Không thể nạp dữ liệu:", response ? response.error : "Unknown error");
        }
    });
}