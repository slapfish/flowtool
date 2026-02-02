# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**flowtool** is a visual architecture planning tool that integrates with AI coding assistants. Users and AI agents both interact with the same visual flow — users through a drag-and-drop editor, AI agents through an MCP server. The shared surface lets users verify that the AI actually understands their architecture before implementation begins.

### Core Problem

AI coding assistants are bad at architecture. Text-based planning is lossy — you describe something, the AI rephrases it, you both think you agree, then the code comes out wrong. A visual representation forces precision that prose can't. flowtool gives both the user and the AI a shared, visual planning surface where misalignment is caught before code gets written.

### Key Design Values

- Visual verification over chat-based planning.
- Encode proven patterns for AI agents: effective prompt templates, schema designs that guide AI behavior, and task decompositions that let cheaper models handle complex work reliably.
- Structured output schemas matter — small changes (e.g., adding a "passed" flag) can determine whether an agent returns garbage or correctly filters results.
- The spec format is the core deliverable. Everything else is interface to it.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7
- **Desktop**: Tauri 2 (Rust backend)
- **Package manager**: pnpm

## Build & Dev Commands

```bash
pnpm install          # Install dependencies
pnpm tauri dev        # Run full app (Tauri + Vite dev server on :1420)
pnpm dev              # Run frontend only (Vite dev server)
pnpm tauri build      # Production build
pnpm build            # Frontend build only (tsc + vite build)
tsc                   # Type check
```

## Architecture

**Local Tauri desktop app** that serves two interfaces:

- **Visual editor UI** — React frontend rendered in Tauri webview. Drag-and-drop nodes, connections, inputs/outputs.
- **MCP server** — Claude Code (or other MCP-compatible tools) connects to read and modify the same flow state.

Both interfaces operate on the same underlying data. User drags nodes in the UI, Claude Code calls MCP tools like `create_flow`, `add_node`, `get_flow` — same flow, two access points.

### Project Structure

- `src/` — React frontend (TypeScript)
- `src-tauri/` — Tauri/Rust backend
- `public/` — Static assets

### Data Model

- Flow state lives on disk in the project directory (e.g., `.flowtool/flow.json`)
- No cloud dependency — everything runs locally
- The spec format (schema for flows, nodes, edges, typed inputs/outputs) is the foundation

### Public Spec Endpoint

flowtool hosts its spec format definition at a public URL so that AI tools without MCP support can still generate compatible output. Users can point any AI tool at the spec and say "generate a flow in this format."

## Business Model

- **Free** — local tool, open source, no account required
- **Enterprise (paid)** — hosted version with team collaboration, shared workspaces, org-level features

## License

MIT (copyright 2026 slapfish)
