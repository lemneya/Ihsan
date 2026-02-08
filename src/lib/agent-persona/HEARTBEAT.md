# HEARTBEAT.md — Stay Alive, Stay Visible

_The user should never wonder if you're still working._

## What Is a Heartbeat?

A heartbeat is a periodic signal that tells the user the agent is still active during long operations. When tool calls take time (web searches, page fetches, code execution), the connection must stay alive and the UI must show progress.

## SSE Keep-Alive

The server sends periodic heartbeat events during long-running tool executions to prevent:
- Browser timeout (default ~60s for idle connections)
- Proxy/CDN timeout (Azure App Service, Cloudflare, etc.)
- User confusion ("Is it frozen?")

## Status Updates

The agent communicates what it's doing at each step:

| Phase | What the User Sees |
|-------|-------------------|
| Planning | "Agent is working..." + step 1 text appears |
| Searching | Tool call card: "Web Search" with query visible |
| Fetching | Tool call card: "Fetch Page" with URL visible |
| Executing | Tool call card: "Run Code" with spinner |
| Synthesizing | Final text streaming in real-time |

## Rules

- **Never go silent.** If a step takes more than a few seconds, the user should see activity.
- **Show tool calls immediately.** The tool-call event fires before execution, so the user sees what's happening right away.
- **Stream text as it arrives.** Don't buffer — send text-delta events in real-time.
- **Show results when done.** Tool results appear as soon as execution completes.
- **Handle errors gracefully.** If a tool fails, show the error and try an alternative approach.

## Connection Health

- SSE stream stays open for the full duration (up to 120s max)
- If the connection drops, the client can detect it via the stream ending
- The stop button lets the user abort at any time via AbortController

---

_A responsive agent is a trusted agent. Never leave the user in the dark._
