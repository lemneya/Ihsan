// Popup script for Ihsan Browser Agent

let pageData = null;
let currentController = null;

// Elements
const pageTitle = document.getElementById("page-title");
const charCount = document.getElementById("char-count");
const pageDot = document.querySelector(".status-dot");
const actions = document.querySelectorAll(".action-btn");
const questionInput = document.getElementById("question-input");
const askBtn = document.getElementById("ask-btn");
const resultArea = document.getElementById("result-area");
const resultContent = document.getElementById("result-content");
const resultLabel = document.getElementById("result-label");
const loading = document.getElementById("loading");
const errorEl = document.getElementById("error");
const errorText = document.getElementById("error-text");
const copyBtn = document.getElementById("copy-btn");
const stopBtn = document.getElementById("stop-btn");
const retryBtn = document.getElementById("retry-btn");
const settingsToggle = document.getElementById("settings-toggle");
const settingsBar = document.getElementById("settings-bar");
const apiUrlInput = document.getElementById("api-url");
const saveSettings = document.getElementById("save-settings");
const openIhsanBtn = document.getElementById("open-ihsan-btn");
const openFull = document.getElementById("open-full");

// Load settings
chrome.runtime.sendMessage({ type: "GET_API_URL" }, (response) => {
  if (response && response.url) {
    apiUrlInput.value = response.url;
    openFull.href = `${response.url}/tools/browser-agent`;
  }
});

// Extract page content on load
async function extractPageContent() {
  try {
    pageDot.className = "status-dot loading";
    pageTitle.textContent = "Extracting content...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab");
    }

    // Check if we can inject into this tab
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:")
    ) {
      throw new Error("Cannot analyze browser internal pages");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_CONTENT",
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "Failed to extract content");
    }

    pageData = response;
    pageDot.className = "status-dot";
    pageTitle.textContent = response.title || tab.url;
    charCount.textContent = `${Math.round(response.length / 1000)}k`;

    // Enable action buttons
    actions.forEach((btn) => (btn.disabled = false));
  } catch (err) {
    pageDot.className = "status-dot error";
    pageTitle.textContent = err.message || "Error loading page";
    actions.forEach((btn) => (btn.disabled = true));
  }
}

// Analyze with action
async function analyze(action, userMessage) {
  if (!pageData) return;

  showLoading(true);
  hideError();
  resultArea.style.display = "none";

  const actionLabels = {
    summarize: "Summary",
    extract: "Extracted Data",
    explain: "Explanation",
    translate: "Translation",
    analyze: "Analysis",
    "action-items": "Action Items",
    question: "Answer",
  };

  resultLabel.textContent = actionLabels[action] || "Result";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "ANALYZE_PAGE",
      pageContent: pageData.content,
      pageUrl: pageData.url,
      pageTitle: pageData.title,
      action,
      userMessage,
    });

    showLoading(false);

    if (!response || !response.success) {
      showError(response?.error || "Analysis failed");
      return;
    }

    resultContent.textContent = response.content;
    resultArea.style.display = "block";

    // Adjust body height
    document.body.style.maxHeight = "580px";
  } catch (err) {
    showLoading(false);
    showError(err.message || "Something went wrong");
  }
}

// Event listeners
actions.forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (action === "translate") {
      analyze(action, "English");
    } else {
      analyze(action);
    }
  });
});

questionInput.addEventListener("input", () => {
  askBtn.disabled = !questionInput.value.trim();
});

questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && questionInput.value.trim()) {
    analyze("question", questionInput.value.trim());
    questionInput.value = "";
    askBtn.disabled = true;
  }
});

askBtn.addEventListener("click", () => {
  if (questionInput.value.trim()) {
    analyze("question", questionInput.value.trim());
    questionInput.value = "";
    askBtn.disabled = true;
  }
});

copyBtn.addEventListener("click", async () => {
  if (resultContent.textContent) {
    await navigator.clipboard.writeText(resultContent.textContent);
    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>`;
    setTimeout(() => {
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    }, 2000);
  }
});

openIhsanBtn.addEventListener("click", () => {
  const url = apiUrlInput.value || "http://localhost:3000";
  chrome.tabs.create({
    url: `${url}/tools/browser-agent`,
  });
});

stopBtn.addEventListener("click", () => {
  showLoading(false);
});

retryBtn.addEventListener("click", () => {
  hideError();
  extractPageContent();
});

settingsToggle.addEventListener("click", () => {
  settingsBar.classList.toggle("visible");
});

saveSettings.addEventListener("click", () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  chrome.runtime.sendMessage({ type: "SET_API_URL", url });
  openFull.href = `${url}/tools/browser-agent`;
  settingsBar.classList.remove("visible");
});

// Helpers
function showLoading(show) {
  loading.style.display = show ? "flex" : "none";
}

function showError(msg) {
  errorText.textContent = msg;
  errorEl.style.display = "flex";
}

function hideError() {
  errorEl.style.display = "none";
}

// Init
extractPageContent();
