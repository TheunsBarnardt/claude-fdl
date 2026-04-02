# Feature Definition Language (FDL)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Blueprints](https://img.shields.io/badge/blueprints-51-blue)](blueprints/)
[![AI Tools](https://img.shields.io/badge/AI_Tools-Claude_|_ChatGPT_|_Copilot-purple.svg)](https://theunsbarnardt.github.io/claude-fdl/using-with-other-ai/)
[![Docs](https://img.shields.io/badge/Docs-GitHub_Pages-green.svg)](https://theunsbarnardt.github.io/claude-fdl/)

**Define features as YAML blueprints. Generate complete implementations for any framework. Extract architectural patterns from any codebase, API docs, or business document.**

FDL is an open-source system for writing "blueprints" — YAML specifications that describe software features completely. You define the *what* (fields, rules, outcomes, errors, events). Any AI tool — Claude, ChatGPT, Copilot, Gemini — reads the blueprint and generates a correct, complete implementation for your chosen language and framework.

No code. No YAML knowledge needed. Seven CLI commands handle everything through plain-language conversation.

---

## What Problems Does This Solve?

- **Every developer rebuilds the same features from scratch.** Login, signup, password reset — something always gets missed.
- **When you ask AI to "build login", it guesses.** There's no shared definition of what "login" actually needs.
- **Business rules live in people's heads.** When it's time to build software, critical rules get lost.

**FDL solves all three.** A blueprint is the single source of truth for a feature — what data it needs, what rules govern it, what should happen in every scenario.

---

## How It Works

| Method | When to use it | Command |
|--------|---------------|---------|
| **Build a full app** | Describe your app in plain English | `/fdl-build "nextjs POS with OTP login"` |
| **Create from scratch** | You know what feature you want | `/fdl-create checkout payment` |
| **Extract from a document** | You have a BRD, policy doc, or SOP | `/fdl-extract docs/policy.pdf` |
| **Extract from a website** | API docs, developer portal | `/fdl-extract-web https://docs.example.com/api` |
| **Extract from code** | Existing codebase or git repo | `/fdl-extract-code ./src/auth login auth` |
| **Extract features selectively** | Large repo, pick only what you want | `/fdl-extract-code-feature https://github.com/org/repo` |
| **Generate code** | You have a blueprint, want code | `/fdl-generate login nextjs` |

---

## Getting Started

```bash
git clone https://github.com/TheunsBarnardt/claude-fdl.git
cd claude-fdl
npm install
```

Open Claude Code and type:

```
/fdl-build "nextjs app with login and POS"   # Build a full app (recommended)
/fdl-create login auth                        # Or create one blueprint at a time
/fdl-generate login nextjs                    # Generate code from a blueprint
```

---

## Static API for AI Tools

Every blueprint is available as JSON — no scraping needed:

```
GET /api/registry.json              — index of all 45 blueprints
GET /api/blueprints/auth/login.json — complete blueprint as JSON
```

Paste into ChatGPT: `https://theunsbarnardt.github.io/claude-fdl/api/blueprints/auth/login.json`

[Browse the API registry](https://theunsbarnardt.github.io/claude-fdl/api/registry.json)

---

## What Else You Gain

Blueprints aren't just templates — they encode transferable architectural patterns:

- **Auth Pack** — Rate limiting, token lifecycle, enumeration prevention
- **Integration Pack** — Async callbacks, idempotency, hardware state machines
- **UI Pack** — Registry architecture, MCP server integration, drag-and-drop
- **CMS Pack** — Lifecycle hooks, row-level security, draft/publish workflows
- **Visual Editor Pack** — Collision detection, undo/redo, plugin systems
- **ERP Pack** — POS sessions, tax computation, bank reconciliation, automation rules
- **Workflow Pack** — Approval chains, SLA enforcement, event-driven automation
- **Wealth Management Pack** — Portfolio valuations, market data feeds, document management, multi-account hierarchies, real-time pricing integration
- **Onboarding Pack** — Client and advisor registration, multi-step onboarding workflows, proposal/quotation generation, state machines, DocuSign integration

---

## Documentation

Full documentation at **[theunsbarnardt.github.io/claude-fdl](https://theunsbarnardt.github.io/claude-fdl/)**:

- [The Seven Commands](https://theunsbarnardt.github.io/claude-fdl/commands/) — detailed reference
- [Blueprint Format](https://theunsbarnardt.github.io/claude-fdl/blueprint-format/) — what's inside a blueprint
- [Blueprint Catalog](https://theunsbarnardt.github.io/claude-fdl/catalog/) — browse all 51 blueprints
- [Combining Blueprints](https://theunsbarnardt.github.io/claude-fdl/combining/) — build complex systems
- [Real-World Examples](https://theunsbarnardt.github.io/claude-fdl/examples/) — 8 walkthroughs
- [Using with ChatGPT & Others](https://theunsbarnardt.github.io/claude-fdl/using-with-other-ai/) — no Claude required
- [FAQ](https://theunsbarnardt.github.io/claude-fdl/faq/)

---

## License

MIT
