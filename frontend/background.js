console.log("🚀 RAG Assistant Background Script is running with Streaming support!");

// --- 1. CHANNEL 1: TRUYỀN THỐNG (Dùng cho Check-URL và Ingest) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "API_CALL") {
        const method = message.method || "POST";
        const fetchOptions = {
            method: method,
            headers: { "Content-Type": "application/json" }
        };
        if (method !== "GET" && message.data) {
            fetchOptions.body = JSON.stringify(message.data);
        }

        fetch(message.url, fetchOptions)
            .then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; 
    }
});

// --- 2. CHANNEL 2: ĐƯỜNG ỐNG STREAMING (Dùng cho Translate và Ask) ---
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "AI_STREAM_PORT") {
        port.onMessage.addListener(async (msg) => {
            try {
                const response = await fetch(msg.url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(msg.data)
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                // Đọc luồng dữ liệu (Stream Reader)
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    // Giải mã byte thành chữ và bắn về Content Script ngay lập tức
                    const chunk = decoder.decode(value, { stream: true });
                    port.postMessage({ type: "CHUNK", content: chunk });
                }
                
                // Báo hiệu AI đã nói xong
                port.postMessage({ type: "DONE" });

            } catch (error) {
                console.error("❌ Streaming Error:", error);
                port.postMessage({ type: "ERROR", message: error.message });
            }
        });
    }
});