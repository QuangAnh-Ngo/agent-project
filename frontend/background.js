console.log("hehehe")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "API_CALL") {
        fetch(message.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.data)
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("Background Fetch Error:", error);
            sendResponse({ success: false, error: error.message });
        });
        
        // QUAN TRỌNG: Trả về true để báo hiệu sẽ phản hồi bất đồng bộ
        return true; 
    }
});