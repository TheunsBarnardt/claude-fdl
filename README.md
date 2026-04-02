# Feature Definition Language (FDL)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Blueprints](https://img.shields.io/badge/Blueprints-16-blue.svg)](blueprints/)
[![AI Tools](https://img.shields.io/badge/AI_Tools-Claude_|_ChatGPT_|_Copilot-purple.svg)](#faq)

**Define features as YAML blueprints. Generate complete implementations for any framework. Extract architectural patterns from any codebase, API docs, or business document.**

FDL is an open-source system for writing "blueprints" — YAML specifications that describe software features completely. You define the what (fields, rules, outcomes, errors, events). Any AI tool — Claude, ChatGPT, Copilot, Gemini — reads the blueprint and generates a correct, complete implementation for your chosen language and framework.

No code. No YAML knowledge needed. Five CLI commands handle everything through plain-language conversation.

---

## What Problems Does This Solve?

**Problem 1: Every developer rebuilds the same features from scratch.**
Login, signup, password reset, file upload, CRUD — these features exist in every app. Every time they're rebuilt, something gets missed. Rate limiting. Account lockout. Email verification. Proper error messages.

**Problem 2: When you ask AI to "build login", it guesses.**
Different AI tools produce different results. One includes rate limiting, another doesn't. One handles account lockout, another ignores it. There's no shared definition of what "login" actually needs.

**Problem 3: Business rules live in people's heads.**
The expense approval policy is in a PDF somewhere. The onboarding process is in a wiki. The checkout flow is in someone's memory. When it's time to build or update the software, critical rules get lost in translation.

**FDL solves all three.** A blueprint is the single source of truth for a feature — what data it needs, what rules govern it, what should happen in every scenario (success and failure), and how it connects to other features.

**But blueprints go further than templates.** When you extract a codebase like shadcn-ui into a blueprint, you don't just capture "how shadcn works." You capture the *architectural patterns* — registry-based distribution, recursive dependency resolution, MCP server integration — that let AI build you an entirely new CLI tool, plugin marketplace, or component CDN using those same patterns. Blueprints are transferable expertise, not just feature specs.

---

## How It Works

```
You describe a feature          Claude Code generates
in plain language          -->  the complete implementation
                                for your framework
```

There are three ways to create a blueprint:

| Method | When to use it | Command |
|--------|---------------|---------|
| **Create from scratch** | You know what feature you want | `/fdl-create checkout payment` |
| **Extract from a document** | You have a BRD, policy doc, or SOP | `/fdl-extract docs/policy.pdf` |
| **Extract from a website** | API docs, developer portal, integration guide | `/fdl-extract-web https://docs.example.com/api` |
| **Extract from code** | Existing codebase, local folder, or git repo | `/fdl-extract-code ./src/auth login auth` |
| **Write YAML directly** | You're technical and want full control | Create a `.blueprint.yaml` file |

Once you have a blueprint, generate code for any language or framework:

```
/fdl-generate login nextjs
/fdl-generate signup express
/fdl-generate login angular
/fdl-generate signup csharp
/fdl-generate expense-approval python
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Claude Code](https://claude.ai/code) (CLI, desktop app, or VS Code extension)

### Step 1: Clone and install

```bash
git clone <your-repo-url>
cd claude-fdl
npm install
```

### Step 2: Create your first blueprint

Open Claude Code in the project directory and type:

```
/fdl-create login auth
```

Claude will ask you a couple of questions in plain English:

> "What should happen when someone logs in successfully?"
> "Should accounts lock after too many failed attempts?"

Based on your answers, it generates a complete blueprint file — you never touch YAML.

### Step 3: Generate the code

```
/fdl-generate login nextjs
```

Claude asks:

> "Generate just login, or include related features (signup, password-reset)?"
> "How should I handle the database? (mock data, Prisma, Drizzle, MongoDB)"

Then it generates a complete, working implementation with all the security rules, error handling, and UI built in.

### Step 4: Validate (optional)

```bash
node scripts/validate.js
```

This checks that all blueprint files are well-formed and that relationships between features are valid.

---

## The Five Commands

### `/fdl-create` — Create a blueprint from a conversation

Tell Claude what feature you want. It asks plain-language questions, offers smart defaults, and generates the blueprint behind the scenes.

```
/fdl-create checkout payment
/fdl-create file-upload data
/fdl-create expense-approval workflow
/fdl-create roles access
```

**What happens:**
1. Claude asks 1-2 questions about what the feature should do
2. It presents a plain-English summary: "Here's what I'll create..."
3. You confirm or adjust
4. Blueprint file is created and validated automatically

**You never see YAML.** Claude handles all the technical details.

### `/fdl-extract` — Extract rules from an existing document

Have a business requirements document, company policy, SOP, or process diagram? Upload it and Claude extracts the rules into a blueprint.

```
/fdl-extract docs/expense-policy.pdf expense-approval workflow
/fdl-extract requirements/checkout-spec.docx checkout payment
/fdl-extract process/onboarding-flow.png onboarding ui
```

**Supported document types:** PDF, Word (.docx), text files, Markdown, images (flowcharts, diagrams)

**What happens:**
1. Claude reads the document
2. It extracts: data fields, business rules, approval steps, roles, timelines, error cases
3. It shows you a plain-English summary of what it found
4. It flags anything unclear: "The document says 'large purchases need extra approval' but doesn't specify the dollar amount — what threshold should I use?"
5. You confirm, and it generates the blueprint

Every extracted rule includes a reference back to the source document (page number, section) so you can trace it.

### `/fdl-extract-web` — Extract rules from a documentation website

Have an API you need to integrate with? Point Claude at the documentation site and it crawls every page, extracts all API operations, rules, fields, and requirements into a blueprint.

```
/fdl-extract-web https://docs.electrumsoftware.com/epc/public/epc-overview epc-payments integration
/fdl-extract-web https://developer.stripe.com/docs/payments checkout payment
/fdl-extract-web https://docs.example.com/api
```

**Works with JS-rendered docs sites** (Docusaurus, ReadMe, Redocly, Swagger UI, etc.) — uses the Chrome browser to read fully-rendered content that standard HTTP fetching can't access.

**What happens:**
1. Claude opens the site in Chrome and maps **all navigation tabs** (Documentation, API Reference, Security, etc.) — not just the sidebar of the landing page
2. It searches for OpenAPI/Swagger specs, Postman collections, and other machine-readable API definitions for maximum technical detail
3. It crawls each page across all tabs, extracting API operations, request/response fields, error codes, authentication methods, security architecture, and integration flows
4. It shows you a plain-English summary of everything found across all pages
5. It flags unclear areas and asks you to clarify
6. It generates one or more blueprints with source URL traceability

**Captures both directions:**
- **Inbound** — webhooks and callbacks the API sends TO you
- **Outbound** — API calls you send TO the service

**Discovers technical resources automatically:**
- OpenAPI/Swagger specifications (JSON/YAML)
- Postman collections
- SDK/client library links
- Webhook event catalogs with payload schemas

**Prerequisite:** Chrome must be open with the Claude extension connected.

### `/fdl-extract-code` — Extract rules from an existing codebase

Have an existing app with business logic already implemented? Point Claude at the source code and it reverse-engineers the features into blueprints.

```
/fdl-extract-code ./src/auth login auth
/fdl-extract-code C:/projects/my-app/src checkout payment
/fdl-extract-code https://github.com/org/repo.git payments integration
/fdl-extract-code ../other-project
```

**Accepts local folders or git repo URLs.** Git repos are cloned automatically (shallow clone for speed).

**Works with any tech stack:** Express, Django, Rails, Spring Boot, Laravel, FastAPI, Next.js, Go, Rust, .NET, and more. Detects the framework from project manifests and code patterns.

**What happens:**
1. Claude maps the project structure — finds models, routes, middleware, validators, services, error classes, event handlers, and tests
2. It reads each layer with language-specific patterns — ORM schemas for fields, route definitions for outcomes, middleware for security rules, test descriptions for acceptance criteria
3. It shows you a plain-English summary: "Here's what I found in 14 files..."
4. It flags incomplete code (TODO/FIXME comments), unused config, and ambiguous logic
5. You confirm, and it generates blueprints with source file traceability (`# Source: src/auth/middleware/rateLimiter.ts:12`)

**Handles edge cases:** Monorepos (asks which service to extract), no-framework codebases (follows import graphs from entry points), multi-language repos (asks which layer to focus on), private repos (asks you to clone locally first).

### `/fdl-generate` — Generate code from a blueprint

Pick a blueprint and a framework. Claude generates a complete, working implementation.

```
/fdl-generate login nextjs
/fdl-generate signup express
/fdl-generate password-reset laravel
/fdl-generate expense-approval nextjs
```

**Works with any language or framework.** Some blueprints include optional hints for specific frameworks (Next.js, Express, Laravel, etc.), but the core specification is language-agnostic. C#, Rust, Angular, Python, Go, Ruby — if Claude can write it, FDL can generate it.

**What you get:**
- Backend: routes, validation, business logic, error handling, security rules
- Frontend: forms, error display, loading states, accessibility
- Types: TypeScript interfaces for inputs, errors, and events
- Events: hooks for audit logs, analytics, and notifications

**What you still need to do:**
- Connect your database (generated code uses mock data by default)
- Set up email sending (for verification emails, password resets)
- Add your CSS/styling (generated forms are functional, not styled)

---

## What's Inside a Blueprint?

You don't need to understand this to use FDL (the commands handle it for you), but here's what a blueprint contains:

| Section | What it does | Example |
|---------|-------------|---------|
| **fields** | Data the feature collects | Email, password, amount, file upload |
| **rules** | Business logic and security | "Lock account after 5 failed attempts" |
| **outcomes** | What should happen in each scenario | "Given valid credentials, then create session, result: redirect to dashboard" |
| **errors** | What to show when things go wrong | "Invalid email or password" (never reveals which one) |
| **events** | Signals for other systems | "login.success" triggers audit log |
| **actors** | Who's involved (for workflows) | Employee, Manager, Finance, System |
| **states** | Status lifecycle (for workflows) | draft -> submitted -> approved -> paid |
| **sla** | Time limits (for workflows) | "Manager must review within 48 hours" |
| **related** | How features connect | Login requires signup, recommends password-reset |
| **flows** | Step-by-step procedures (for documentation) | Useful for business process documentation |

### Outcomes vs Flows

FDL has two ways to describe what a feature does:

**Outcomes** (recommended) describe **what must be true**:
> "Given the user exists and the password matches, then a session is created and the login.success event fires. Result: redirect to dashboard."

**Flows** describe **what steps to follow**:
> "Step 1: Validate fields. Step 2: Look up user. Step 3: Compare password. Step 4: Create session."

**Why outcomes are better for AI:** When you tell any AI *what* must be true instead of *how* to do it, it picks the best implementation for your specific framework. Outcomes are like acceptance criteria — flows are like recipes.

**When to use flows:** For business processes where humans need documented procedures (expense approvals, employee onboarding, support ticket escalation).

### Structured Conditions (machine-precise)

Outcomes can use structured conditions that are unambiguous and machine-parseable:

```
INSTEAD OF:  "amount is over $1,000 and status is submitted"
USE:         field: amount, source: input, operator: gt, value: 1000
             field: status, source: db, operator: eq, value: submitted
```

Key features:
- **AND/OR logic** — top-level conditions are AND; use `any:` for OR groups
- **Priority** — outcomes are checked in order (rate limit first, success last)
- **Data sources** — each condition knows where its data comes from (input, db, request, session, system)
- **Structured side effects** — actions like `set_field`, `emit_event`, `transition_state`, `notify` are machine-parseable
- **Operators with type contracts** — each operator has defined accepted types (e.g., `gt` accepts number/duration, `matches` accepts string regex)
- **Error binding** — outcomes bind to specific error codes (`error: LOGIN_INVALID_CREDENTIALS`) so the code generator knows exactly which error to return
- **Transaction boundaries** — `transaction: true` marks an outcome's side effects as atomic (all succeed or all roll back)
- **Expression language** — `when:` conditions use a formal grammar: `failed_login_attempts >= 5`, `amount > 1000 and status == "submitted"`, `now - 60m`

Plain text conditions still work alongside structured ones — use whichever is clearer.

---

## Blueprint Categories

| Category | What it's for | Examples |
|----------|--------------|---------|
| `auth` | Login, signup, identity | login, signup, password-reset, MFA, logout |
| `data` | CRUD, storage, search | file-upload, CRUD, search, pagination |
| `access` | Permissions and roles | roles, permissions, invite-users |
| `ui` | UI patterns | onboarding wizard, dashboard, settings |
| `integration` | External services | webhooks, API connectors, OAuth |
| `notification` | Messaging | email, push notifications, in-app alerts |
| `payment` | Money | checkout, subscriptions, invoicing |
| `workflow` | Business processes | expense approval, content review, onboarding |

---

## Included Blueprints

FDL ships with 16 blueprints. But here's the thing — **blueprints are not just templates to copy.** Each one encodes production-tested architectural patterns that transfer to entirely different problems. The login blueprint doesn't just build you a login page. It teaches AI how to build rate limiting, token lifecycle management, and enumeration prevention for *anything*.

### How to Think About Blueprints

A blueprint is **captured expertise**. When you extract the shadcn-ui codebase into a blueprint, you don't just get "a description of shadcn." You get the architectural patterns for building:
- Your own CLI with a plugin/registry system
- Your own component distribution CDN
- Your own MCP server so AI tools can discover and install your packages
- Your own dependency resolver with recursive tree-walking

When you extract a payment system, you don't just get "how Electrum works." You get the patterns for:
- Asynchronous request-callback flows (any webhook system)
- Idempotency key management (any distributed system)
- Multi-party transaction orchestration (any escrow, marketplace, or clearing system)
- State machines with SLA enforcement (any time-sensitive workflow)

**The real power is combining blueprints.** Take the registry architecture from `shadcn-cli` + the state machine from `expense-approval` + the rate limiting from `login` — and you have the spec for a plugin marketplace with approval workflows and abuse prevention. No blueprint exists for that, but the patterns compose.

### Auth Pack — Security Patterns You Can Reuse Everywhere

| Blueprint | What it is | What else you gain |
|-----------|-----------|-------------------|
| `login` | Email + password auth with rate limiting, lockout, sessions | **Rate limiting per scope** (per-IP, per-email) — works for any brute-forceable endpoint. **Token lifecycle** (access + refresh with rotation) — works for API keys, OAuth, device tokens. **Enumeration prevention** — same pattern protects any lookup from leaking existence. |
| `signup` | Registration with verification and bot prevention | **Layered validation** (format, uniqueness, business rules) — works for any multi-step form. **Bot detection** (honeypot + CAPTCHA + rate limit) — works for any public-facing endpoint. **Async side effects** (send email without blocking response) — works for any notification trigger. |
| `password-reset` | Two-step recovery via secure email token | **Two-phase async verification** — the request-then-confirm pattern works for email changes, phone verification, account recovery, magic links. **Token hashing in storage** — prevents DB breach from exposing active tokens. **Session invalidation on credential change** — critical for any "account was compromised" response. |
| `logout` | End session (single device or all devices) | **Scoped revocation** (this device vs. everywhere) — works for API key management, OAuth token revocation. **CSRF protection on state-changing actions** — applies to any POST that mutates state. |
| `email-verification` | Confirm ownership via one-time token | **Token-based claim verification** — same pattern works for phone numbers, domains, webhook endpoints, device pairing. **Rate-limited resends** — prevents notification bombing in any system. |

### Integration Pack — Distributed System Patterns

| Blueprint | What it is | What else you gain |
|-----------|-----------|-------------------|
| `palm-vein` | Hardware SDK integration (PVD300/PVM310) | **Hardware device state machine** (init, open, idle, operating, closed) — works for any peripheral: scanners, printers, card readers, IoT devices. **Buffer lifecycle management** — works for any resource-heavy SDK. **Operation cancellation with cleanup** — works for any long-running hardware operation. |
| `biometric-auth` | Palm vein as login alternative | **Multi-enrollment with selection** (left/right palm, up to 2) — works for backup phones, security keys, recovery emails. **Graceful fallback** (scanner unavailable, fall back to password) — works for any optional hardware feature. **Template auto-update on match** — works for any "improve accuracy over time" system. |
| `chp-inbound-payments` | Receive payments from clearing system | **1-second ACK + async processing** — the acknowledge-immediately-process-later pattern works for any webhook receiver. **Idempotency via unique reference** — prevents duplicate processing in any distributed system. **Request-response decoupling** (receive request, ACK, POST response back later) — works for any long-running external integration. |
| `chp-outbound-payments` | Send payments through clearing system | **Bulk operations** (submit N items, track individually) — works for batch email, bulk imports, mass notifications. **Conflict detection** (HTTP 409 with original error) — the detect-and-return-original pattern works for any retry scenario. **Status polling** — works for any long-running job. |
| `chp-request-to-pay` | PayShap request-to-pay and refunds | **Time-limited offers** (RTP expires if not responded to) — works for coupon expiry, invite links, temporary access. **Cancellation with state guards** (only cancel if still pending) — works for any "undo" that's only valid in certain states. **Refund with sensible defaults** — works for any reversal operation. |
| `chp-eft` | Batch electronic funds transfer | **Settlement batching** (collect, submit batch, get results later) — works for any queue-then-batch-process pattern. **Reason code enums** — works for categorized rejection/error reporting in any domain. **Post-fact correction** (undo already-committed transactions) — works for any system that needs reversals. |
| `chp-account-management` | Account mirroring and proxy resolution | **Proxy resolution** (phone/email/ID to account number) — the indirect-to-direct identifier pattern works for username resolution, device discovery, DNS-like lookups. **Pre-flight verification** (check if account can receive before sending) — works for any "validate before expensive operation" pattern. |
| `blockradar-api` | Blockchain wallet and transaction management | **Multi-chain abstraction** — works for any system that unifies multiple backends behind one API. **Webhook event catalog** — works for any event-driven integration. |

### UI Pack — Component Architecture and Tooling Patterns

| Blueprint | What it is | What else you gain |
|-----------|-----------|-------------------|
| `shadcn-cli` | CLI for installing UI components from registries | **Registry/plugin architecture** (namespace, URL, auth headers, dependency resolution) — build your own package registry, plugin marketplace, or template distribution system. **MCP server** (7 tools for AI assistants to discover and install components) — build AI-native interfaces for any catalog. **Framework detection** (auto-detect Next.js, Vite, Django, Rails, etc.) — build any multi-framework CLI tool. **Safe file mutation** (backup before overwrite, validate paths) — build any CLI that modifies user projects. |
| `shadcn-components` | 56 accessible React UI components with design system | **Variant system via CVA** (variant + size to className) — build any component library with configurable visual states. **Compound component pattern** (Dialog.Trigger, Dialog.Content) — build composable UI APIs. **Multi-theme architecture** (6 design styles, light/dark, CSS variables in OKLCH) — build a swappable design system. **Accessibility patterns** (focus trap, ARIA attributes, keyboard navigation) — build WCAG-compliant components in any framework. |

### Workflow Pack — Business Process Patterns

| Blueprint | What it is | What else you gain |
|-----------|-----------|-------------------|
| `expense-approval` | Submit, review, approve, pay with actors and SLAs | **Role-based approval routing** (managers approve small, finance approves large) — works for loan approval, hiring, procurement, content review. **State machine with escalation** — works for any process with deadlines and fallback paths. **Conditional field requirements** (receipt required only above $25) — works for any "rules change based on value" scenario. **Audit trail** (who approved what, when, from where) — works for any compliance requirement. |

### Combining Blueprints — The Real Power

Individual blueprints are useful. **Combining them is where it gets interesting:**

| You want to build... | Combine these blueprints |
|----------------------|--------------------------|
| **Plugin marketplace with approval** | `shadcn-cli` (registry + CLI) + `expense-approval` (state machine + roles) + `login` (rate limiting) |
| **Payment gateway** | `chp-outbound-payments` (orchestration) + `login` (API key auth) + `chp-account-management` (verification) |
| **Hardware enrollment system** | `biometric-auth` (multi-enrollment + fallback) + `signup` (registration flow) + `email-verification` (claim verification) |
| **SaaS onboarding wizard** | `signup` (account creation) + `email-verification` (confirm ownership) + `expense-approval` (step-by-step workflow pattern) |
| **IoT device management platform** | `palm-vein` (hardware state machine) + `shadcn-cli` (registry for device drivers) + `chp-account-management` (proxy resolution for device IDs) |
| **Loan origination system** | `expense-approval` (multi-step approval + SLAs) + `chp-outbound-payments` (disbursement) + `login` (secure access) |

### Recreating or Customizing Blueprints

Every blueprint can be recreated from scratch with different rules:

```
/fdl-create login auth
/fdl-create signup auth
/fdl-create expense-approval workflow
```

Your answers shape the blueprint — different lockout thresholds, different password rules, different approval chains. Same architectural patterns, your business rules.

---

## Real-World Examples

### Example 1: Build a login system for your Next.js app

```
/fdl-create login auth
```
> Claude asks: "Should accounts lock after failed attempts?" You say yes, 5 attempts, 15-minute lockout.

```
/fdl-generate login nextjs
```
> Claude asks: "Use mock data or Prisma?" You pick Prisma.
> Claude generates 5 files: page, server action, business logic, types, form component.
> Rate limiting, lockout, secure cookies, enumeration prevention — all built in.

### Example 2: Turn a policy document into working software

Your company has an expense approval policy in a PDF. It says:
- Expenses over $25 need receipts
- Managers approve first
- Expenses over $1,000 need finance approval too
- Must be processed within 30 days

```
/fdl-extract docs/expense-policy.pdf expense-approval workflow
```
> Claude reads the PDF, extracts all the rules, shows you what it found.
> You confirm, and it creates a blueprint with actors, state machine, SLAs, and all the business rules.

```
/fdl-generate expense-approval nextjs
```
> Now you have a working expense approval system with the exact rules from the PDF.

### Example 3: Extract an API integration from a documentation website

You need to integrate with a payment platform. The API docs are at a URL:

```
/fdl-extract-web https://docs.electrumsoftware.com/epc/public/epc-overview epc-payments integration
```
> Claude opens Chrome, maps all 12 sidebar pages, crawls each one.
> It extracts: 6 inbound webhooks, 4 outbound API calls, JWT security requirements, CDV account validation, PayShap proxy resolution, and transaction lifecycle states.
> You confirm, and it creates a blueprint with every API operation as an outcome.

```
/fdl-generate epc-payments express
```
> Now you have a complete integration layer with webhook handlers, API client, JWT signing, and error handling.

### Example 4: Reverse-engineer an existing codebase into a blueprint

You have a working Express app with authentication already implemented. You want to capture the exact business rules as a blueprint — then regenerate for a different framework:

```
/fdl-extract-code ./src/auth login auth
```
> Claude reads your models, routes, middleware, validators, and tests.
> It finds: 8 fields from Prisma schema, rate limiting from middleware (5 attempts / 15 min), JWT token config from constants, 12 test cases as acceptance criteria.
> You confirm, and it creates a blueprint with every rule traced back to its source file.

```
/fdl-generate login nextjs
```
> Now you have the same exact business rules implemented in Next.js — nothing lost in translation.

### Example 5: Build a complete auth system

```
/fdl-create login auth
/fdl-create signup auth
/fdl-create password-reset auth
/fdl-generate login nextjs
/fdl-generate signup nextjs
/fdl-generate password-reset nextjs
```

Six commands. Complete authentication system with login, registration, password reset, email verification hooks, rate limiting, account lockout, and secure session management.

---

## Project Structure

```
claude-fdl/
  schema/
    blueprint.schema.yaml      # The rules that all blueprints must follow
  blueprints/
    auth/                      # Authentication blueprints
    data/                      # Data and workflow blueprints
    integration/               # External service and hardware integration blueprints
    ui/                        # UI component systems and developer tooling blueprints
  scripts/
    validate.js                # Validates blueprints are well-formed
  .claude/
    skills/
      fdl-create/              # Create blueprints from conversation
      fdl-extract/             # Extract blueprints from documents
      fdl-extract-web/         # Extract blueprints from documentation websites
      fdl-extract-code/        # Extract blueprints from existing codebases
      fdl-generate/            # Generate code from blueprints
```

---

## Validation

Check that all blueprints are valid:

```bash
# Validate everything
node scripts/validate.js

# Validate one blueprint
node scripts/validate.js blueprints/auth/login.blueprint.yaml

# Watch mode (re-validates on file changes)
npm run validate:watch
```

The validator checks:
- Blueprint structure matches the schema
- All required sections are present
- Naming conventions are followed
- Related features point to blueprints that exist
- Outcomes have the correct structure (given/then/result)

---

## FAQ

**Do I need to know YAML?**
No. The `/fdl-create` and `/fdl-extract` commands handle everything through plain-language questions. You only see YAML if you choose to edit blueprints directly.

**Can I extract from an existing codebase?**
Yes. `/fdl-extract-code` reads a local folder or clones a git repo, then analyzes models, routes, middleware, validators, services, error handling, events, and tests to reverse-engineer the implemented features into blueprints. Works with any tech stack — Express, Django, Rails, Spring, Laravel, FastAPI, Next.js, Go, Rust, .NET, and more.

**Does this only work with Claude?**
No. The blueprints are standard YAML files — any AI tool can read them. You can paste a blueprint into ChatGPT, Copilot, Gemini, or any other AI and ask it to generate code. The `/fdl-create`, `/fdl-extract`, `/fdl-extract-web`, `/fdl-extract-code`, and `/fdl-generate` slash commands are Claude Code skills that make the experience smoother, but the blueprints themselves are AI-agnostic.

**What languages and frameworks are supported?**
All of them. Blueprints describe what the feature does, not how to build it. Any language, any framework: Next.js, Express, Laravel, Angular, React, Vue, C#/.NET, Rust, Python/Django, Go, Ruby on Rails, Flutter, Swift, and anything else. Some blueprints include optional `extensions` with hints for specific frameworks, but they're not required.

**Can I use this for business processes, not just UI features?**
Yes. Blueprints support actors (who does what), state machines (status lifecycles), SLAs (time limits), and approval chains. The expense-approval blueprint is a full example.

**Can I extract rules from existing documents?**
Yes. `/fdl-extract` reads PDFs, Word docs, text files, and even images of flowcharts. It extracts the rules and creates a blueprint, with references back to the source document.

**Can I extract from a website or API docs?**
Yes. `/fdl-extract-web` crawls documentation websites (even JS-rendered ones like Docusaurus, ReadMe, or Redocly) using Chrome. It discovers all navigation tabs (Documentation, API Reference, Security, etc.), searches for OpenAPI specs and Postman collections, reads every page, and extracts API operations, fields, rules, security architecture, and error codes into blueprints with source URL traceability.

**How is this different from just asking AI to "build login"?**
Without FDL, the AI guesses what "login" means. With FDL, there's a complete specification: 5 failed attempts = lockout, 15-minute duration, constant-time password comparison, generic error messages to prevent user enumeration, JWT with 15-minute access tokens. Nothing is left to chance. Every AI tool gets the same spec and produces consistent results.

---

## Why This Matters for Next-Generation AI Models

FDL isn't just useful today — it becomes **dramatically more valuable** as AI models get more capable. Here's why.

### The Problem with "Build Me X"

When you tell any current AI model to "build me a login system," it generates code based on patterns from its training data. The result is inconsistent — different models produce different security rules, different error handling, different edge cases. Every time you prompt, you roll the dice.

Blueprints eliminate the dice roll. They give the model a **complete, unambiguous specification** — every field, every rule, every outcome, every error, every event. The model doesn't guess. It implements.

### Better Models Need Better Specifications

The trajectory of AI models is clear: each generation gets better at coding, reasoning, and multi-step execution. Claude Opus 4.6 can already read a blueprint and generate a full-stack implementation. But the next generation of models — like [Claude Mythos](https://fortune.com/2026/03/26/anthropic-says-testing-mythos-powerful-new-ai-model-after-data-leak-reveals-its-existence-step-change-in-capabilities/), which Anthropic describes as "a step change" in AI performance — will be able to do things current models can't:

- **Autonomous multi-step execution** — Mythos [plans and executes sequences of actions on its own](https://www.mindstudio.ai/blog/what-is-claude-mythos-anthropic-most-powerful-model), moving across systems and making decisions without waiting for human input at each stage. A blueprint gives this kind of agent the **complete specification** it needs to work autonomously without going off-track.

- **Multi-file code generation with planning** — Next-gen models show [dramatically higher scores on complex software engineering tasks](https://www.mindstudio.ai/blog/claude-mythos-vs-opus-4-6-capability-comparison) where the model needs to plan before writing. Blueprints are exactly this — a pre-planned specification that the model can execute with full context.

- **Security-aware implementation** — Models like Mythos are [particularly strong at identifying vulnerabilities](https://siliconangle.com/2026/03/27/anthropic-launch-new-claude-mythos-model-advanced-reasoning-features/) and reasoning through security scenarios. FDL blueprints encode security rules explicitly (rate limiting, enumeration prevention, token hashing, CSRF protection) — giving security-aware models the exact constraints to enforce.

### What This Means in Practice

As models become more agentic and autonomous, the value of structured specifications increases exponentially:

| Model capability | Without blueprints | With blueprints |
|-----------------|-------------------|-----------------|
| **Basic code generation** | Generates plausible code, misses edge cases | Generates correct code covering all specified scenarios |
| **Multi-file projects** | Inconsistent patterns across files, forgets constraints | Consistent rules enforced across every file |
| **Autonomous agents** | Drifts from intent, makes assumptions, invents requirements | Stays on-spec, implements exactly what's defined, nothing more |
| **Cross-framework migration** | Re-prompts from scratch for each framework, loses rules | Same blueprint, different target — all rules preserved |
| **Multi-model workflows** | Each model interprets differently, results diverge | Every model reads the same spec, results converge |

### Blueprints as AI Infrastructure

Think of FDL blueprints as **infrastructure for AI-powered development**:

- **Today:** You use blueprints with Claude Code's slash commands to generate implementations. Works well.
- **Near-term:** Agentic models consume blueprints autonomously — reading the spec, generating code, running tests, fixing failures, and shipping features with minimal human input. The blueprint is the agent's contract.
- **Long-term:** Blueprints become the interface between humans and AI. You describe what you want in business terms. AI extracts it into a blueprint. Another AI (or the same one) generates the implementation. A third verifies it matches the spec. The blueprint is the shared language.

The better the model, the more it benefits from precise specifications. A model that can plan, reason about security, and execute autonomously doesn't need less structure — it needs **better** structure so it can use its capabilities fully instead of wasting them on guessing requirements.

**FDL is that structure.** Every blueprint you create today is an investment that gets more valuable with every model generation.

---

## License

MIT
