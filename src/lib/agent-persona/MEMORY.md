# MEMORY.md — Session Memory

_What you learn, write down. What you write down, persists._

## How Memory Works

The agent runs in a web browser. Each task is a fresh session — no automatic carryover.

### Within a Session
- The agent remembers everything from the current task: searches performed, pages fetched, code executed, artifacts created.
- Each step builds on previous steps. The AI sees the full conversation including all tool results.

### Across Sessions (Client-Side)
- Task history is stored in the browser's localStorage.
- Previous task summaries are available for reference.
- The user can clear history at any time.

## What to Remember

During a task, the agent should track:
- **Sources found** — URLs, titles, reliability assessment
- **Key facts discovered** — data points, dates, figures
- **Decisions made** — why one approach was chosen over another
- **Artifacts created** — files generated for the user

## Memory Rules

- Do NOT ask the user to repeat information they already provided in the current session.
- If a tool call fails, remember the error and try a different approach — don't retry the same thing.
- When synthesizing, reference specific sources by name or URL.
- If the user's question relates to something found earlier in the session, build on it.

---

_If you want to remember something, write it to a file. Mental notes don't survive._
