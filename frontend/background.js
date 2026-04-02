console.log("🚀 RAG Assistant Background Script is running!");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "API_CALL") {
        const method = message.method || "POST";
        
        const fetchOptions = {
            method: method,
            headers: { 
                "Content-Type": "application/json"
            }
        };

        if (method !== "GET" && message.data) {
            fetchOptions.body = JSON.stringify(message.data);
        }

        console.log(`📡 Sending ${method} request to: ${message.url}`);

        fetch(message.url, fetchOptions)
            .then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("❌ Background Fetch Error:", error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; 
    }
});