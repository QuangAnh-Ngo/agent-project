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
    // 1. Hiện trạng thái Loading chuyên nghiệp
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

    try {
        const response = await fetch("http://localhost:8080/api/v1/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: window.location.href,
                highlighted_text: text
            })
        });

        if (!response.ok) throw new Error("Backend Error");
        const data = await response.json();

        // 2. Render kết quả kèm nút Copy (Đúng Task 3.3)
        ragContainer.innerHTML = `
            <div class="rag-result-box">
                <div class="rag-header">
                    <span>✨ Bản dịch thông minh (RAG)</span>
                    <div class="rag-close" id="rag-close-btn">✖</div>
                </div>
                <div class="rag-body">${data.translation}</div>
                <div class="rag-footer">
                    <button class="rag-copy-btn" id="rag-copy-btn">
                        📋 Copy bản dịch
                    </button>
                </div>
            </div>
        `;

        // Logic cho các nút bấm
        document.getElementById("rag-close-btn").onclick = destroyFloatingUI;
        
        const copyBtn = document.getElementById("rag-copy-btn");
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(data.translation);
            copyBtn.innerHTML = "✅ Đã Copy!";
            setTimeout(() => { copyBtn.innerHTML = "📋 Copy bản dịch"; }, 2000);
        };

    } catch (error) {
        ragContainer.innerHTML = `
            <div class="rag-result-box">
                <div class="rag-header">
                    <span style="color: #d93025;">Lỗi hệ thống</span>
                    <div class="rag-close" id="rag-close-btn">✖</div>
                </div>
                <div class="rag-body" style="color: #d93025;">
                    ⚠️ Không thể kết nối với AI. Hãy đảm bảo Docker đang chạy và bạn đã cấu hình GEMINI_API_KEY.
                </div>
            </div>
        `;
        document.getElementById("rag-close-btn").onclick = destroyFloatingUI;
    }
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
    try {
        const response = await fetch("http://localhost:8080/api/v1/ingest", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                url: window.location.href,
                content: content
            })
        });

        const result = await response.json();
        console.log("🚀 Đã nạp dữ liệu trang web:", result.message);
    } catch (error) {
        console.error("❌ Không thể nạp dữ liệu trang web:", error);
    }
}