# TOOLS.md — Tool Reference

_How your tools work and their constraints._

---

## Core Tools

### web_search

- **Engine:** DuckDuckGo HTML (no API key required)
- **Returns:** Up to 8 results with title, snippet, URL
- **Timeout:** 10 seconds
- **Tips:**
  - Use specific, descriptive queries
  - Try multiple query phrasings for better coverage
  - Recent events may need date qualifiers ("2026")
  - DuckDuckGo is privacy-focused — no personalization

### web_fetch

- **Input:** Any HTTP/HTTPS URL
- **Returns:** Page title + text content (HTML stripped)
- **Max content:** 30,000 characters (truncated with notice)
- **Timeout:** 15 seconds
- **Tips:**
  - Works best on articles, docs, and text-heavy pages
  - JavaScript-rendered content (SPAs) won't be captured
  - Paywalled content will show the paywall, not the article
  - Some sites block automated requests — try alternatives if one fails

### run_javascript

- **Environment:** Node.js VM sandbox
- **Timeout:** 5 seconds
- **Available:** JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Map, Set, parseInt, parseFloat
- **NOT available:** require, process, fetch, globalThis, setTimeout, setInterval, file system
- **Output:** Return value + console.log() output
- **Tips:**
  - Use console.log() for output — it gets captured
  - Good for: calculations, data transformation, string processing
  - Not for: HTTP requests, file I/O, long-running tasks
  - Keep code simple — you only have 5 seconds

### create_artifact

- **Input:** title (filename), language, content
- **Output:** Displayed with syntax highlighting + download button
- **Tips:**
  - Use a real filename as title (e.g., "fibonacci.py")
  - Set language correctly for syntax highlighting
  - Include all necessary code — the user should be able to run it as-is
  - Add comments explaining key sections

### create_diagram

- **Input:** title, Mermaid diagram code
- **Output:** Rendered SVG diagram in the browser
- **Supports:** flowcharts, sequence diagrams, mind maps, timelines, Gantt charts, class diagrams, state diagrams, ER diagrams, pie charts, architecture diagrams
- **Tips:**
  - Use valid Mermaid syntax — invalid code shows a fallback code block
  - Keep diagrams focused — too many nodes become hard to read
  - Great for: architecture overviews, process flows, comparisons, timelines

---

## Ihsan Platform Tools

These tools invoke specialized AI models with domain-specific system prompts. They produce complete, professional output in markdown format. Each one is downloadable by the user.

### generate_slides

- **Input:** topic, audience, goal, duration_min, tone, constraints
- **Optional:** `research` (bullet-point claims + source URLs from your web research), `outline` (slide titles + takeaways from your outline step)
- **Output:** Full markdown slide deck with speaker notes
- **Format:** Slides separated by `---`, each with `## Slide N: Title`
- **Includes:** Title slide, content slides (count computed from spec), conclusion, speaker notes
- **Use when:** User wants a presentation, pitch deck, lecture, or training material
- **Workflow note:** When the slides-generator skill workflow is active, complete Steps 0-3 (intake, research, outline, visual planning) BEFORE calling this tool. Pass your research and outline as parameters so the inner model builds from your findings.

### generate_document

- **Input:** brief (what document to create)
- **Output:** Professional structured document in markdown
- **Includes:** Title, table of contents, sections, summary
- **Use when:** User wants reports, proposals, essays, letters, memos, articles, guides, business plans

### generate_code

- **Input:** spec (language, framework, requirements)
- **Output:** Complete, production-ready code with setup instructions
- **Includes:** Imports, error handling, comments, file structure
- **Use when:** User needs full applications, components, or scripts — more powerful than `run_javascript`
- **Note:** Defaults to TypeScript for web projects

### generate_design

- **Input:** brief (what to design)
- **Output:** Complete design specification
- **Includes:** Color palette (hex codes), typography, layout, components, CSS/Tailwind code, HTML, responsive notes, accessibility notes, SVG for logos
- **Use when:** User wants UI/UX specs, brand identity, component designs, or visual guidelines

### generate_spreadsheet

- **Input:** request (what data or analysis to generate)
- **Output:** Well-structured markdown tables with analysis
- **Includes:** Column headers, realistic data, calculations, summary section
- **Use when:** User wants data tables, financial models, comparisons, analytics

### generate_image_prompts

- **Input:** description (what image the user wants)
- **Output:** 4 detailed prompts for AI image generators
- **Includes:** Varied styles (photorealistic, illustration, digital art, watercolor), technical parameters (aspect ratio, lighting, camera angle), negative prompt suggestions
- **Use when:** User wants to create images with DALL-E, Midjourney, or Stable Diffusion

### generate_music

- **Input:** request (genre, mood, topic)
- **Output:** Complete music composition specification
- **Includes:** Lyrics with verse/chorus/bridge, chord progressions, tempo (BPM), instrumentation, AI music prompts for Suno/Udio
- **Use when:** User wants to create songs, jingles, or musical compositions

### generate_video_script

- **Input:** concept (topic, style, audience, duration)
- **Output:** Complete video production plan
- **Includes:** Script with scenes, shot list, storyboard descriptions, B-roll suggestions, music/SFX recommendations, AI video prompts for Sora/Runway/Kling
- **Use when:** User wants to produce videos, ads, tutorials, or cinematic content

---

_Know your tools. Use them well. Chain them for maximum impact._
