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
            <div class="rag-body">
                <div class="rag-loading">⏳ Đang phân tích ngữ cảnh...</div>
            </div>
        </div>
    `;

    try {
        const response = await fetch("http://localhost:8080/api/v1/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: window.location.href,
                highlighted_text: text
            })
        });

        const data = await response.json();

        ragContainer.innerHTML = `
            <div class="rag-result-box">
                <div class="rag-header">
                    <span>Bản dịch thông minh</span>
                    <div class="rag-close" id="rag-close-btn">✖</div>
                </div>
                <div class="rag-body">${data.translation}</div>
            </div>
        `;

        document.getElementById("rag-close-btn").onclick = destroyFloatingUI;

    } catch (error) {
        ragContainer.innerHTML = `
            <div class="rag-result-box">
                <div class="rag-body" style="color: #d93025;">
                    Lỗi kết nối Backend. Hãy kiểm tra Docker!
                </div>
            </div>
        `;
        setTimeout(destroyFloatingUI, 3000);
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