// Background service worker for Ihsan Browser Agent

// Default API URL
const DEFAULT_API_URL = "http://localhost:3000";

// Get API URL from storage
async function getApiUrl() {
  const result = await chrome.storage.local.get(["apiUrl"]);
  return result.apiUrl || DEFAULT_API_URL;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYZE_PAGE") {
    handleAnalyze(request).then(sendResponse);
    return true; // Keep message channel open for async
  }

  if (request.type === "SET_API_URL") {
    chrome.storage.local.set({ apiUrl: request.url });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "GET_API_URL") {
    getApiUrl().then((url) => sendResponse({ url }));
    return true;
  }
});

async function handleAnalyze(request) {
  const apiUrl = await getApiUrl();
  const { pageContent, pageUrl, pageTitle, action, userMessage } = request;

  try {
    const res = await fetch(`${apiUrl}/api/browser-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageContent,
        pageUrl,
        pageTitle,
        action,
        userMessage,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `API error ${res.status}: ${text}` };
    }

    // Read the plain text stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    return { success: true, content: result };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to connect to Ihsan API",
    };
  }
}
