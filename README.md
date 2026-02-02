# flowtool

A visual architecture planning tool that integrates with AI coding assistants. Both users and AI agents interact with the same visual flow — users through a drag-and-drop editor, AI agents through an MCP server.

## The Problem

AI coding assistants are bad at architecture. You describe something in chat, they make assumptions, build the wrong structure, then waste time fixing it while orphaning good ideas along the way. "Planning mode" is just more chat — you can't verify alignment until you see the code. A visual tool lets you catch misalignment before implementation: wrong flow, unnecessary steps, missing logic. You see it, you fix it, then you hand off.

## How It Works

flowtool is a local desktop app (Tauri) that serves two interfaces to the same underlying flow data:

- **Visual editor** — drag-and-drop UI for designing architecture. Connect logical units (data fetching, transformation, decision points, AI calls), define inputs/outputs for each step, see the full flow at a glance.
- **MCP server** — Claude Code (or other MCP-compatible tools) connects to read and modify the same flow. Both the user and the AI can contribute to the plan.

### Typical Workflow

1. User tells Claude Code: "analyze my codebase and create a flowtool architecture"
2. Claude Code calls MCP endpoints — nodes appear in the visual editor in real-time
3. User reviews, drags things around, removes/renames steps in the UI
4. User tells Claude Code: "implement this plan"
5. Claude Code reads the current flow via MCP and starts coding

### Deeper Value

The tool encodes hard-won knowledge about how to make AI agents actually work. Accurate prompts are incredibly difficult, and it's nearly impossible to tell if you've improved one or made it worse without running it. Structured output schemas can make or break functionality — something as simple as adding a "passed" flag can be the difference between an agent returning garbage or correctly filtering results. Complex tasks need to be decomposed for cheaper models to handle them reliably. flowtool bakes in these patterns: prompt templates that work, schema designs that guide the AI, and task breakdowns that let you use nano where others waste money on opus.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Desktop**: Tauri (Rust backend)
- **Package manager**: pnpm

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (Tauri + Vite)
pnpm tauri dev

# Run frontend only
pnpm dev

# Build for production
pnpm tauri build

# Type check
tsc
```

### IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Business Model

- **Free** — local app, open source, no account required
- **Enterprise** — hosted version with team collaboration, shared workspaces, org-level features

## License

MIT
