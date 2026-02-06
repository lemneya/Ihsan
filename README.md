# Ihsan — AI Search & Assistant

**Ihsan** (Arabic for *excellence/perfection*) is a modern AI-powered search and assistant platform inspired by [Genspark](https://genspark.ai). It delivers rich, structured **Sparkpages** instead of simple chat responses — turning every query into a comprehensive, wiki-like answer.

## Features

- **Sparkpages** — Structured, rich answer panels with sections, summaries, and source citations
- **Multi-Model Support** — Switch between Claude, GPT-4o, and Gemini models on the fly
- **Streaming Responses** — Real-time token-by-token streaming via Vercel AI SDK
- **Modern UI** — Clean, responsive design with dark mode support, smooth animations
- **Markdown Rendering** — Full GFM markdown with syntax highlighting, tables, and more
- **Conversation History** — Sidebar with conversation management
- **Copy, Rate, Regenerate** — Full interaction controls on every response

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide Icons |
| AI | Vercel AI SDK v6 (multi-provider) |
| Models | Anthropic Claude, OpenAI GPT-4o, Google Gemini |
| Animations | Framer Motion |
| Markdown | react-markdown + remark-gfm |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/lemneya/Ihsan.git
cd ihsan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

```env
# Add at least one:
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using Ihsan.

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts       # Streaming chat API (multi-model)
│   ├── chat/[id]/page.tsx      # Chat conversation page
│   ├── page.tsx                # Landing page with search
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles + dark mode
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx       # Message input with tools
│   │   ├── ChatMessage.tsx     # Message bubble with markdown
│   │   └── ModelSelector.tsx   # Multi-model dropdown
│   ├── layout/
│   │   ├── Header.tsx          # App header
│   │   └── Sidebar.tsx         # Conversation sidebar
│   ├── search/
│   │   └── SparkPage.tsx       # Genspark-inspired rich answer card
│   └── ui/
│       └── Button.tsx          # Reusable button component
└── lib/
    ├── models.ts               # Model configurations
    ├── store.ts                # Simple state store
    └── utils.ts                # Utility functions
```

## Inspired By

- [Genspark](https://genspark.ai) — Multi-agent AI search engine with Sparkpages
- [Perplexity](https://perplexity.ai) — AI-powered search with citations

## License

MIT
