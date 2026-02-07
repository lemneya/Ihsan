// Content script — extracts page text when requested by the popup

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_CONTENT") {
    try {
      // Get page title
      const title = document.title || "";

      // Get main content - try common content selectors first
      const selectors = [
        "article",
        "main",
        '[role="main"]',
        ".post-content",
        ".article-content",
        ".entry-content",
        "#content",
        ".content",
      ];

      let contentEl = null;
      for (const sel of selectors) {
        contentEl = document.querySelector(sel);
        if (contentEl && contentEl.textContent.trim().length > 100) break;
        contentEl = null;
      }

      // Fall back to body
      if (!contentEl) {
        contentEl = document.body;
      }

      // Clone and clean the element
      const clone = contentEl.cloneNode(true);

      // Remove non-content elements
      const removeSelectors = [
        "script",
        "style",
        "noscript",
        "svg",
        "nav",
        "footer",
        "header",
        "aside",
        ".sidebar",
        ".ad",
        ".advertisement",
        ".cookie-banner",
        ".popup",
        ".modal",
        '[role="navigation"]',
        '[role="banner"]',
        '[role="complementary"]',
        '[aria-hidden="true"]',
      ];

      for (const sel of removeSelectors) {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      }

      // Extract text with some structure
      let text = "";

      function extractText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const trimmed = node.textContent.trim();
          if (trimmed) text += trimmed + " ";
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();

        // Add structure markers
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
          const level = "#".repeat(parseInt(tag[1]));
          text += "\n" + level + " ";
        } else if (tag === "p" || tag === "div" || tag === "section") {
          text += "\n";
        } else if (tag === "li") {
          text += "\n- ";
        } else if (tag === "br") {
          text += "\n";
        }

        for (const child of node.childNodes) {
          extractText(child);
        }

        if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"].includes(tag)) {
          text += "\n";
        }
      }

      extractText(clone);

      // Clean up whitespace
      text = text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

      // Limit size
      const maxLen = 60000;
      if (text.length > maxLen) {
        text = text.slice(0, maxLen) + "\n\n[Content truncated...]";
      }

      sendResponse({
        success: true,
        title,
        url: window.location.href,
        content: text,
        length: text.length,
      });
    } catch (err) {
      sendResponse({
        success: false,
        error: err.message || "Failed to extract page content",
      });
    }
  }

  // Return true to indicate async response
  return true;
});
