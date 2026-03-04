document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsDiv = document.getElementById('results');

  // Lấy tab hiện tại
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let videoId = null;

  // Trích xuất Video ID từ URL
  if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
    const urlParams = new URLSearchParams(new URL(tab.url).search);
    videoId = urlParams.get('v');
    
    if (videoId) {
        statusDiv.textContent = "✅ Sẵn sàng tìm kiếm!";
        statusDiv.style.background = "#d4edda";
        statusDiv.style.color = "#155724";
        searchInput.disabled = false;
        searchBtn.disabled = false;
    }
  } else {
    statusDiv.textContent = "❌ Vui lòng mở một video YouTube.";
    statusDiv.style.background = "#f8d7da";
    statusDiv.style.color = "#721c24";
    return;
  }

  // Xử lý nút tìm kiếm
  searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.textContent = "Đang suy nghĩ...";
    searchBtn.disabled = true;
    resultsDiv.innerHTML = "";

    try {
      // GỌI API THẬT XUỐNG BACKEND
      const response = await fetch("http://localhost:8080/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, query: query })
      });

      const data = await response.json();

      if (data.status === "success" && data.results.length > 0) {
        data.results.forEach(item => {
          const div = document.createElement('div');
          div.className = 'result-item';
          
          const minutes = Math.floor(item.timestamp / 60);
          const seconds = Math.floor(item.timestamp % 60);
          const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

          div.innerHTML = `
            <span class="timestamp">[${timeString}]</span> 
            ${item.text}
            <span class="score">Độ tin cậy: ${Math.round(item.score * 100)}%</span>
          `;
          
          // Lệnh tua video
          div.addEventListener('click', () => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (seconds) => {
                const vid = document.querySelector('video');
                if(vid) { vid.currentTime = seconds; vid.play(); }
              },
              args: [item.timestamp]
            });
          });
          resultsDiv.appendChild(div);
        });
      } else {
        resultsDiv.innerHTML = "<p style='text-align:center;font-size:12px;'>Không tìm thấy kết quả phù hợp.</p>";
      }
    } catch (error) {
      resultsDiv.innerHTML = `<p style='color:red;font-size:12px;'>Lỗi kết nối Backend: ${error.message}</p>`;
    } finally {
      searchBtn.textContent = "Tìm kiếm AI";
      searchBtn.disabled = false;
    }
  });
});