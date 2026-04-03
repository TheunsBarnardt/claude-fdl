---
name: fdl-build
description: Build a full application from a natural language description — searches blueprints, suggests features, resolves gaps, and generates code
user_invocable: true
command: fdl-build
arguments: "<app-description>"
---

# FDL Build — App Orchestrator

Build a complete application from a plain-English description. You don't need to know what blueprints exist — this skill searches them, suggests what you're missing, explains why each piece matters, disambiguates overlapping options, fills gaps, and orchestrates full code generation.

This is the flagship skill of FDL. It ties together `/fdl-create`, `/fdl-generate`, `/fdl-extract`, `/fdl-extract-web`, and `/fdl-extract-code` into a single guided experience.

## Usage

```
/fdl-build "nextjs app with shadcn and mongoose, OTP login, full POS system"
/fdl-build "express API for expense approval workflow with email notifications"
/fdl-build "flutter mobile app with biometric login and product catalog"
/fdl-build "laravel e-commerce store with stripe payments and admin dashboard"
/fdl-build "react app with supabase auth and drag-drop page builder"
```

## Arguments

- `<app-description>` — Plain-English description of the app. Include the tech stack, features, and any specific requirements. Be as vague or specific as you want — the skill will ask clarifying questions and fill in the rest.

## Core Principles

1. **The user knows NOTHING about YAML or blueprints.** Never show YAML. Never use FDL jargon (outcomes, flows, events, fields). Use plain language throughout.
2. **Be an opinionated advisor, not a passive menu.** Actively guide the user toward a complete, production-ready system. Warn about missing pieces. Explain why each suggestion matters.
3. **Never skip security.** If the app needs authentication, insist on it even if the user didn't mention it. If a blueprint has rate limiting, implement it.
4. **Leverage existing blueprints first.** Only create new ones when nothing fits. The 50+ existing blueprints cover a LOT — search thoroughly before declaring a gap.
5. **Explain WHY, not just WHAT.** Every suggestion has a reason. "You need tax-engine because POS order lines need tax computation" — not just "Adding tax-engine."

---

## Phase 1: Parse & Confirm Intent (1 question max)

### Step 1: Extract from the description

Split the user's input into three buckets:

- **Stack** — framework, UI library, database/ORM, infrastructure
- **Features** — everything else (login, POS, approval workflow, etc.)
- **Implicit requirements** — things the user didn't say but clearly need (e.g., "POS" implies products, payments, tax, receipts)

### Step 2: Recognize technology terms

Use this lookup to classify terms from the description:

**Frameworks:**
| User says | Means |
|-----------|-------|
| next, nextjs, next.js | Next.js (App Router — not Pages Router) |
| express | Express.js |
| laravel | Laravel (PHP) |
| angular | Angular |
| react | React (Vite — not Next.js unless SSR mentioned) |
| vue, nuxt | Vue.js / Nuxt |
| svelte, sveltekit | SvelteKit |
| django | Django (Python) |
| fastapi | FastAPI (Python) |
| flask | Flask (Python) |
| go, gin | Go (Gin) |
| rust, axum, actix | Rust (Axum/Actix) |
| csharp, dotnet, aspnet | ASP.NET (C#) |
| flutter | Flutter (Dart) |
| react-native | React Native (mobile) |

**UI libraries:**
| User says | Maps to | Has blueprint? |
|-----------|---------|----------------|
| shadcn | shadcn/ui | YES — `ui/shadcn-components` + `ui/shadcn-cli` |
| material, mui | Material UI | No |
| bootstrap | Bootstrap | No |
| tailwind | Tailwind CSS (utility CSS, not a component lib) | No |
| antd | Ant Design | No |

**Databases / ORMs:**
| User says | Database choice |
|-----------|----------------|
| mongoose, mongo, mongodb | MongoDB via Mongoose |
| prisma | Prisma (ask: PostgreSQL or MySQL?) |
| drizzle | Drizzle ORM |
| typeorm | TypeORM |
| sequelize | Sequelize |
| postgres, pg | PostgreSQL (ask which ORM) |
| mysql | MySQL (ask which ORM) |
| sqlite | SQLite |
| supabase | Supabase (PostgreSQL + auth + realtime) |

### Step 3: Present interpretation for confirmation

```
I understood your request as:

STACK:
  Framework: Next.js (App Router)
  UI Library: shadcn/ui
  Database: MongoDB via Mongoose

FEATURES YOU NEED:
  - User authentication with OTP login
  - Full Point-of-Sale system (sales, payments, products, receipts)

Is this right, or should I adjust anything?
```

Use AskUserQuestion with options:
- "Yes, find the blueprints" (proceed to Phase 2)
- "I want to adjust something" (ask what to change)

**Only ask this question if the description is ambiguous.** If it's crystal clear (e.g., "nextjs pos with login"), skip confirmation and go straight to Phase 2.

---

## Phase 2: Blueprint Search & Match

### Step 1: Load the COMPLETE blueprint inventory (dynamic — never hardcoded)

**Always discover blueprints dynamically. Never rely on a hardcoded list — new blueprints can be added at any time.**

1. **Primary source:** Glob `blueprints/**/*.blueprint.yaml` to find ALL blueprint files on disk. This is the authoritative source — it always reflects the latest state.
2. **For each file found:** Read the YAML header to extract `feature`, `description`, `tags[]`, `category`, and `related[]`.
3. **Secondary source:** Also read `docs/api/registry.json` as a quick index — but if any blueprint file on disk is NOT in the registry, use the file directly. The filesystem always wins.

**Why filesystem-first:** Users frequently add new blueprints via `/fdl-create`, `/fdl-extract`, etc. These files exist on disk immediately but may not appear in registry.json until `npm run generate` is run. The skill must find them regardless.

### Step 2: Three-tier matching algorithm

For each feature keyword extracted in Phase 1, run these three matching tiers in order:

**Tier 1 — Exact feature name match**
Check if any blueprint's `feature` field matches the keyword exactly or with common suffix/prefix patterns:
- "login" → `feature: login` (exact)
- "pos" → `feature: pos-core` (prefix match)
- "shadcn" → `feature: shadcn-components`, `feature: shadcn-cli` (prefix match)
- "expense" → `feature: expense-approval` (prefix match)

**Tier 2 — Tag match**
Scan every blueprint's `tags[]` array for the keyword. Also try common synonyms of the keyword:
- For the user's keyword, check if any blueprint's tags contain the keyword as a substring or exact match
- Also expand the keyword into synonyms using domain knowledge (e.g., "auth" also means "authentication", "login", "session"; "pos" also means "point-of-sale", "sales", "checkout")
- Score by number of tag hits — more matching tags = stronger match

**This is fully dynamic.** You are scanning the actual tags from the actual blueprints on disk. If someone added a new blueprint with tag "otp", it will be found automatically. There is no hardcoded tag list.

**Tier 3 — Semantic / description match**
Read each blueprint's `description` field and use domain knowledge to match concepts that don't hit on name or tags:
- Use your understanding of software domains to connect user terms to blueprint descriptions
- If the user says "full X" (e.g., "full POS"), look at the matched blueprint's `related` array to discover the full ecosystem
- If no blueprint matches a keyword at all, flag it as a GAP

### Step 3: Read `related` arrays from every matched blueprint

For each matched blueprint, read the actual YAML file and extract its `related` array. Each entry has:
- `feature` — the related blueprint's feature name
- `type` — one of: `required`, `recommended`, `optional`, `extends`
- `reason` — human-readable explanation of WHY this relation exists

Collect all related blueprints into three buckets:
- **Required** — MUST be included. The matched blueprint literally won't work without these.
- **Recommended** — SHOULD be included. The matched blueprint works without these, but the system is incomplete.
- **Optional** — COULD be included. Nice-to-have additions.

### Step 4: Scan category siblings

For each matched blueprint, list other blueprints in the **same category** that weren't already found. These become "You might also want" suggestions.

Example: If `payment/pos-core` is matched, also list `payment/invoicing-payments` and `payment/loyalty-coupons` if they weren't already found via `related` arrays.

---

## Phase 3: Disambiguate Overlapping Blueprints

**BEFORE presenting the suggestion checklist**, check if any of the matched blueprints overlap — meaning multiple blueprints could serve the same purpose.

### How to detect overlaps

- Same category + similar tags (e.g., `auth/login`, `auth/biometric-auth`, `auth/payload-auth` all have authentication-related tags)
- Same concept but different scope (e.g., `data/expense-approval` vs `workflow/odoo-expense-approval`)
- Feature name is a substring of another (e.g., `document-management` vs `payload-uploads`)

### Known overlap groups

| Concept | Options | Key difference |
|---------|---------|----------------|
| Authentication | `auth/login`, `auth/biometric-auth`, `auth/payload-auth` | Email+password vs biometric scanner vs full JWT+API key system |
| Expense approval | `data/expense-approval`, `workflow/odoo-expense-approval` | Generic vs Odoo-specific with accounting integration |
| Onboarding | `workflow/client-onboarding`, `workflow/advisor-onboarding` | Client/customer vs financial advisor |
| Collections/CRUD | `data/payload-collections`, (generic CRUD) | Payload CMS collections vs generic REST CRUD |
| Document management | `data/document-management`, `data/payload-uploads` | Full doc management with versions vs file uploads only |

### Disambiguation format

When an overlap is detected, present a comparison using AskUserQuestion with multiSelect: true:

```
I found 3 authentication blueprints. Which fits your app?

1. auth/login — Simple email + password
   Best for: Standard web apps. Most common choice.

2. auth/biometric-auth — Palm vein biometric scanner
   Best for: Kiosks, physical access, high-security environments.

3. auth/payload-auth — JWT sessions + API keys + account locking
   Best for: CMS/headless apps built on the Payload framework.

You can pick more than one if you want multiple login methods.
```

### Auto-resolve rules

Skip the question and pre-select when context makes the answer obvious:
- User said "biometric POS" → pre-select `biometric-auth`, confirm briefly
- User said "payload CMS" → pre-select `payload-auth`
- User said "simple login" or just "login" → pre-select `auth/login`
- User said "kiosk" → pre-select `biometric-auth` if available
- User mentions a specific system name (Payload, Odoo) → pick that variant

Even when auto-resolving, briefly mention: "I'm using auth/login (email + password) since you described a standard web app. Let me know if you want biometric or API-key auth instead."

---

## Phase 4: The Suggestion Checklist (FLAGSHIP INTERACTION)

This is the key UX of `/fdl-build`. Present all discovered blueprints as a **grouped, selectable checklist** that guides the user toward a complete system.

### Grouping rules

Organize blueprints into these groups, in this order:

1. **CORE** — Blueprints directly matched from the user's description. Pre-checked.
2. **REQUIRED** — Blueprints that are `related.type: required` by any CORE blueprint. Pre-checked. Show the `reason` field.
3. **RECOMMENDED** — Blueprints that are `related.type: recommended` by any matched blueprint. NOT pre-checked. Show the `reason` field.
4. **YOU MIGHT ALSO WANT** — Category siblings + `optional` relations + domain-knowledge suggestions. NOT pre-checked. Brief description only.
5. **GAPS** — Features the user mentioned but no blueprint exists for. Flagged with `!`.

### Presentation format

First, present the full list as formatted text so the user can see everything at a glance:

```
Based on your description, here's what I found in the blueprint library:

CORE (from your description):
  [x] auth/login — Email + password authentication
  [x] payment/pos-core — Sales sessions, orders, payments, receipts
  [x] ui/shadcn-components — Accessible UI component library
  [x] ui/shadcn-cli — CLI tooling for shadcn project setup

REQUIRED (needed by your core features):
  [x] auth/signup — User must exist before they can log in (required by login)
  [x] payment/invoicing-payments — POS session closing posts journal entries to accounting (required by pos-core)
  [x] data/tax-engine — Tax computation applied to every order line (required by pos-core)

RECOMMENDED (will make your app more complete):
  [ ] auth/password-reset — Users will forget passwords (recommended by login)
  [ ] auth/logout — End user session and clear tokens
  [ ] auth/email-verification — Verify email ownership before account is fully active
  [ ] payment/loyalty-coupons — Rewards, discounts, and promotions for POS orders
  [ ] data/product-configurator — Product attributes, variants, and dynamic pricing

YOU MIGHT ALSO WANT:
  [ ] ui/self-order-kiosk — Customer self-ordering terminals for your POS
  [ ] ui/ecommerce-store — Full online storefront with cart and checkout
  [ ] data/bank-reconciliation — Reconcile POS payments with bank statements
  [ ] workflow/automation-rules — Event-driven automation triggers

GAPS (no blueprint exists yet):
  ! OTP / one-time-password login — not in the blueprint library
```

Then use AskUserQuestion with multiSelect: true to let the user select which RECOMMENDED and YOU MIGHT ALSO WANT items to include. List all non-pre-checked items as selectable options.

### Opinionated guidance rules

Be an advisor, not just a list presenter. Add warnings and explanations:

**Missing foundation warnings (driven by `related` arrays):**

The primary source for these warnings is the `related` array in each selected blueprint. If a blueprint declares a `required` or `recommended` relation to another blueprint, and that target is NOT in the user's selection, warn them using the `reason` field from the relation.

For example, if `payment/pos-core` declares:
```yaml
related:
  - feature: tax-engine
    type: required
    reason: "Tax computation applied to every order line"
```
...and the user hasn't selected `tax-engine`, warn: "POS order totals won't include tax — tax-engine is required by pos-core because: Tax computation applied to every order line."

**This is fully dynamic.** If someone adds a new blueprint with a `related: required` entry, the warning appears automatically. No hardcoded warning table to maintain.

**Additional domain-knowledge warnings:**

Beyond what `related` arrays declare, apply these general principles:
- If ANY feature requires authentication (check its rules/outcomes for auth references) but no auth blueprint is selected → warn and suggest adding auth
- If auth blueprints are selected but no logout → warn about missing session termination
- If data/backend features are selected but no UI blueprints → ask if UI suggestions are wanted
- If multiple auth methods are selected → note they'll share a unified session system

**Anti-pattern warnings:**

- Auth without email-verification → "Unverified emails mean fake accounts and no recovery path"
- Multiple auth methods but no unified session handling → "I'll ensure these share a single session system"
- Any feature with security rules but auth not selected → "This feature needs authentication — adding it"

### Required relation enforcement

If the user unchecks a `required` relation, warn them specifically:

```
pos-core REQUIRES tax-engine — without it, order totals won't include tax and the accounting integration will break. Are you sure you want to remove it?
```

Use AskUserQuestion:
- "Keep it (you're right)" (re-add it)
- "Remove it anyway (I'll handle tax myself)" (respect the choice)

### Second round of suggestions

After the user makes their selection, check if any NEWLY selected blueprints have their own `related` blueprints that weren't shown in the first round.

- If 3+ new suggestions emerge, present a brief second-round checklist
- If 1-2 new suggestions, mention them in text: "Since you added loyalty-coupons, you might also want automation-rules for triggering promotions automatically."
- **Maximum 2 suggestion rounds.** After the second round, proceed regardless.

---

## Phase 5: Resolve Gaps

For each feature that has NO matching blueprint (shown as GAPS in the checklist), present resolution options.

### Gap resolution format

```
"OTP login" doesn't have a blueprint yet. How would you like to handle it?
```

Use AskUserQuestion:
- **"Create from scratch"** — Invoke `/fdl-create otp-login auth` inline. Let it ask its 1-2 questions about the feature (SMS vs email OTP, code length, expiry time, etc.), generate the blueprint, then continue with the build. The new blueprint is added to the generation list.
- **"Extract from documentation"** — Ask for a URL or file path. If URL, invoke `/fdl-extract-web <url>`. If file, invoke `/fdl-extract <file-path>`. Get the blueprint, add to generation list.
- **"Extract from existing code"** — Ask for a local folder path or git repo URL. Invoke `/fdl-extract-code <path>`. Get the blueprint, add to generation list.
- **"Skip for now"** — Exclude from generation. Note it as a TODO in the final summary so the user remembers to come back to it.

### Delegation rules for gap resolution

When delegating to another skill:
1. Let the delegated skill run its full conversation flow (it may ask 1-2 questions)
2. Once the blueprint is created and validated, resume the build flow
3. Add the new blueprint to the generation list in the correct dependency position
4. If the new blueprint declares `related` entries, check if any new required dependencies were introduced

---

## Phase 6: Generation Plan & Execution

### Step 1: Build dependency order

Read `related` arrays from ALL selected blueprints. Build a dependency graph:
- `required` relations = **hard dependencies** (generate dependency FIRST)
- `recommended` and `optional` relations = **no ordering constraint** (can be generated in any order)

Topologically sort the graph. If cycles exist (rare), break at the `optional` edge.

### Step 2: Present the generation plan

```
GENERATION PLAN (Next.js + shadcn + Mongoose):

  Order  Feature                    Depends on
  ─────  ─────────────────────────  ──────────────────────
  1      auth/signup                (none — foundation)
  2      auth/login                 signup
  3      auth/otp-login             login (NEW blueprint)
  4      auth/password-reset        signup
  5      auth/logout                login
  6      data/tax-engine            (none)
  7      data/product-configurator  (none)
  8      payment/invoicing-payments (none)
  9      payment/pos-core           invoicing-payments, tax-engine
  10     payment/loyalty-coupons    pos-core
  11     ui/shadcn-components       (none — UI foundation)

  Database: MongoDB via Mongoose (applied to all)
  UI Library: shadcn/ui

Ready to generate? Or adjust the order/selection?
```

Use AskUserQuestion:
- "Generate all" (proceed)
- "I want to adjust" (ask what to change)

### Step 3: Generate shared infrastructure

Before generating individual features, create the project scaffolding:

- **Database connection module** — single connection file shared by all features (e.g., `src/lib/db.ts` for Mongoose)
- **Auth middleware** — if any auth features are selected, create the middleware that protects routes
- **Shared types file** — start with common types (User, Session, ApiResponse, etc.)
- **Base layout** — if frontend framework, create root layout with providers (auth, theme, etc.)
- **Environment config** — `.env.example` with all required environment variables
- **Package dependencies** — consolidated `package.json` additions

### Step 4: Generate each feature

For each blueprint in dependency order, apply the same generation approach as `/fdl-generate`:

1. **Read the blueprint YAML** — load the full file
2. **Read outcomes** sorted by `priority` (lower = check first) — these are acceptance criteria
3. **Read rules** — these are constraints (security, business logic)
4. **Read fields** — these are the data model
5. **Read errors** — these are error responses
6. **Generate code** that satisfies ALL outcomes using the target framework's idiomatic patterns
7. **Track generated files** — maintain a running list so the next feature can import from previous ones

**Critical: Import, don't duplicate.** Before generating a type/model/service, check if a previous feature already created it. If login created a `User` model, signup MUST import it — not create a new one.

**Critical: Consistent patterns.** All features use the same:
- Error handling pattern
- Validation library (pick once: Zod, Joi, Yup, etc.)
- API response format
- Auth checking approach
- Code style and conventions

### Step 5: Show progress

After each feature is generated, show brief progress:

```
[1/11] auth/signup ✓ — 5 files
[2/11] auth/login ✓ — 5 files
[3/11] auth/otp-login ✓ — 4 files (NEW blueprint)
[4/11] auth/password-reset ✓ — 4 files
[5/11] auth/logout ✓ — 3 files
[6/11] data/tax-engine ✓ — 4 files
[7/11] data/product-configurator ✓ — 6 files
[8/11] payment/invoicing-payments ✓ — 6 files
[9/11] payment/pos-core ✓ — 8 files
[10/11] payment/loyalty-coupons ✓ — 5 files
[11/11] ui/shadcn-components ✓ — setup complete
```

### Step 6: Cross-feature integration glue

After all individual features are generated, create the integration layer:

- **Navigation component** — links to all generated pages/routes
- **Route protection** — auth middleware applied to routes that need it
- **Type consolidation** — if multiple features created overlapping types, merge into shared module
- **Event bus setup** — if multiple features emit events, create a shared event system
- **Error handling** — unified error boundary / error handler that knows all error codes

---

## Phase 7: Final Summary

Present the complete build result:

```
BUILD COMPLETE: POS App (Next.js + shadcn + Mongoose)

FILES GENERATED: 47 files across 11 features

FEATURES:
  ✓ auth/signup — User registration
  ✓ auth/login — Email + password login
  ✓ auth/otp-login — One-time password login (NEW blueprint)
  ✓ auth/password-reset — Password recovery
  ✓ auth/logout — Session termination
  ✓ data/tax-engine — Tax computation
  ✓ data/product-configurator — Product catalog
  ✓ payment/invoicing-payments — Invoicing lifecycle
  ✓ payment/pos-core — Point-of-sale
  ✓ payment/loyalty-coupons — Rewards & discounts
  ✓ ui/shadcn-components — UI components

INTEGRATION:
  ✓ Shared MongoDB connection (src/lib/db.ts)
  ✓ Auth middleware (src/middleware.ts)
  ✓ Root layout with providers (src/app/layout.tsx)
  ✓ Navigation component (src/components/nav.tsx)
  ✓ Shared types (src/lib/types/)

NEEDS YOUR WORK:
  ⚠ Environment variables — copy .env.example to .env and fill in:
    - MONGODB_URI (your MongoDB connection string)
    - OTP_PROVIDER_KEY (SMS/email service API key)
    - PAYMENT_PROVIDER_KEY (Stripe/etc. API key)
    - JWT_SECRET (generate a random 64-char string)

SKIPPED (come back to these later):
  ○ (none — or list any features the user chose to skip)

NEXT STEPS:
  1. cp .env.example .env  (then fill in credentials)
  2. npm install
  3. npm run dev
  4. Visit http://localhost:3000

BLUEPRINTS CREATED: 1 new blueprint
  - blueprints/auth/otp-login.blueprint.yaml (created during this build)
```

---

## Phase 8: System Documentation (MANDATORY — never skip)

After all code is generated and the summary is shown, produce comprehensive documentation for the entire system. This is NOT optional — every build ends with documentation.

### Step 1: Create `SYSTEM.md` in the project root

This is the master document. It covers:

```markdown
# {App Name} — System Documentation

## Architecture Overview
- High-level description of the system
- Tech stack: framework, database, UI library, key packages
- Folder structure diagram (generated from the file manifest)

## Features
For each feature, document:
- What it does (plain English)
- Which blueprint powered it
- Key files generated
- Dependencies on other features

## API Endpoints
For each route/endpoint generated:
- Method + path (e.g., POST /api/auth/login)
- Request body / parameters
- Response format (success + error)
- Authentication required? (yes/no)

## Data Models
For each model/schema created:
- Field names, types, and constraints
- Relationships to other models
- Indexes (if any)

## Environment Variables
Complete list of all required env vars:
- Variable name
- Description
- Example value
- Which feature needs it

## Setup Instructions
Step-by-step instructions to get the app running:
1. Clone / install
2. Environment setup
3. Database setup
4. Run the app
5. Verify it works

## Feature Map (Blueprint Traceability)
Table mapping every generated file back to the blueprint and outcome that produced it:
| File | Blueprint | Outcome/Rule |
|------|-----------|-------------|
| src/lib/auth/login.ts | auth/login | successful_login, rate_limited |
| ... | ... | ... |

## What's NOT Included (Gaps / Skipped)
List any features that were skipped or not covered, with notes on how to add them later.
```

### Step 2: Create `API.md` if the app has API endpoints

Detailed API reference with request/response examples for every endpoint.

### Step 3: Present documentation summary to the user

```
DOCUMENTATION GENERATED:
  ✓ SYSTEM.md — Full system documentation ({N} sections)
  ✓ API.md — API reference ({N} endpoints documented)

Your app is fully documented and ready to go.
```

---

## Dynamic Blueprint Discovery (CRITICAL — never hardcode)

**All blueprint matching is dynamic.** When new blueprints are added via `/fdl-create`, `/fdl-extract`, or any other means, they are automatically available to `/fdl-build` on the next run. There is NO hardcoded list of features, tags, or aliases to maintain.

### How discovery works at runtime

1. **Glob `blueprints/**/*.blueprint.yaml`** — this finds every blueprint that exists right now, including any just created
2. **Read each file's YAML header** — extract `feature`, `description`, `tags[]`, `category`, `related[]`
3. **Build an in-memory index** — keyed by feature name, with tags and description as searchable fields
4. **Match against user keywords** — using the three-tier algorithm (name → tags → description)

### Why this matters

If the user ran `/fdl-create otp-login auth` yesterday, and today runs `/fdl-build "nextjs app with OTP login"`, the skill MUST find `auth/otp-login` automatically. It should never say "OTP is a gap" when a blueprint for it exists on disk.

### Technology alias map (static — these are stack terms, not blueprints)

Framework and database terms are NOT blueprints — they describe the tech stack. These aliases are stable:

**Frameworks:** next/nextjs → Next.js, express → Express.js, laravel → Laravel, angular → Angular, react → React, vue/nuxt → Vue/Nuxt, svelte/sveltekit → SvelteKit, django → Django, fastapi → FastAPI, go/gin → Go, rust/axum/actix → Rust, csharp/dotnet → ASP.NET, flutter → Flutter, react-native → React Native

**Databases:** mongoose/mongo → MongoDB, prisma → Prisma, drizzle → Drizzle, postgres → PostgreSQL, mysql → MySQL, sqlite → SQLite, supabase → Supabase

**UI libraries:** shadcn → shadcn/ui, material/mui → Material UI, bootstrap → Bootstrap, tailwind → Tailwind CSS, antd → Ant Design

### Dynamic synonym expansion

When matching user keywords to blueprints, expand synonyms using domain knowledge:
- "auth" → also search for "authentication", "login", "session", "jwt"
- "pos" → also search for "point-of-sale", "sales", "checkout", "register"
- "ecommerce" → also search for "store", "shop", "cart", "catalog"
- etc.

But do NOT hardcode which blueprint these map to. Let the tag/name/description search find the right ones dynamically. If someone adds a new `auth/sso-login` blueprint with tag "authentication", it will be found automatically.

---

## Dynamic Disambiguation

When multiple blueprints match the same user keyword, ALWAYS disambiguate before proceeding.

### How to detect overlaps (dynamically)

After running the three-tier matching algorithm, check if a single user keyword matched **2+ blueprints in the same category** or **2+ blueprints with overlapping tags**. These are overlaps that need disambiguation.

**Do NOT maintain a hardcoded list of known overlaps.** Detect them at runtime:
1. Group all matched blueprints by the user keyword that found them
2. If a keyword matched 2+ blueprints, it's an overlap
3. Read each overlapping blueprint's `description` to understand the difference

### Disambiguation presentation

For each overlap group, present a comparison using each blueprint's own `description` field:

```
I found {N} blueprints for "{keyword}". Which fits your app?

1. {category}/{feature} — {first line of description}
   Best for: {infer from description and tags}

2. {category}/{feature} — {first line of description}
   Best for: {infer from description and tags}

You can pick more than one if you want to combine them.
```

Use AskUserQuestion with multiSelect: true.

### Auto-resolve rules (skip the question when context is clear)

- User mentions a **specific system name** that appears in a blueprint's description or tags (e.g., "Payload", "Odoo", "Electrum") → pick that variant, confirm briefly
- User says "simple" or "basic" → pick the blueprint with the shortest description / fewest features
- User says "full" or "complete" → pick the blueprint with the most comprehensive description
- Only one blueprint's description actually matches the user's use case → pick it, confirm briefly

Even when auto-resolving, briefly mention your choice so the user can correct it.

---

## Delegation Rules

How `/fdl-build` delegates to other FDL skills:

| Situation | Delegate to | How |
|-----------|-------------|-----|
| Gap: user chooses "create from scratch" | `/fdl-create <feature> <category>` | Invoke the skill. Let it run its 1-2 question conversation. Get the blueprint. Resume build. |
| Gap: user has a requirements document | `/fdl-extract <file-path>` | Invoke with the file path. Let it extract. Get the blueprint. Resume build. |
| Gap: user has a documentation URL | `/fdl-extract-web <url>` | Invoke with the URL. Let it crawl and extract. Get the blueprint. Resume build. |
| Gap: user has existing code | `/fdl-extract-code <path>` | Invoke with the path/repo URL. Let it analyze. Get the blueprint. Resume build. |
| User wants to discover features in code | `/fdl-extract-code-feature <path>` | For discovery only — presents a feature menu from the codebase. Not part of main build flow. |
| Code generation for each feature | Apply `/fdl-generate` approach directly | Do NOT invoke as a separate skill (would lose context). Instead, follow the same outcome-driven generation approach: read blueprint, generate code for framework. This preserves knowledge of previously generated files and enables cross-feature imports. |

### Important: Inline generation, not skill delegation

For the actual code generation step, do NOT literally call `/fdl-generate` as a separate skill invocation. This would lose the context of:
- Previously generated files (needed to prevent duplicates)
- Shared types already created
- Database connection module location
- Auth middleware location
- The user's stack choices

Instead, apply the same generation approach that `/fdl-generate` uses (read outcomes, translate to code) but within the build context where you have full knowledge of what's already been generated.

---

## Multi-Blueprint Generation Rules

These rules apply when generating multiple features in sequence. They prevent the common problems of multi-feature generation: duplicated code, inconsistent patterns, and missing integration.

### Rule 1: Shared infrastructure first

Before generating any feature-specific code, create:
- Database connection module (`src/lib/db.ts` or equivalent)
- Auth middleware (if any auth features are selected)
- Shared types file (`src/lib/types/index.ts` or equivalent)
- Base layout (if frontend framework — root layout with providers)
- Environment config (`.env.example` with all required variables)
- Package.json additions (all dependencies for all features)

### Rule 2: Import, don't duplicate

Before generating any type, model, or service, check if a previous feature already created it:
- If login created `User` model → signup MUST import it
- If signup created `validateEmail()` → login MUST import it
- If pos-core created `Order` type → invoicing-payments MUST import it

Maintain a running registry of all exports from all generated files.

### Rule 3: Consistent patterns across all features

Pick these choices ONCE and apply to ALL features:
- Validation library (Zod, Joi, Yup — pick one)
- Error handling pattern (error codes + messages format)
- API response format (`{ success, data, error }` or similar)
- Auth checking approach (middleware vs per-route vs decorator)
- State management approach (if frontend)
- Code style (named exports vs default, async/await vs promises)

### Rule 4: Track all generated files

After generating each feature, add its files to a running manifest:
```
GENERATED FILES:
  src/lib/db.ts                     (shared — database connection)
  src/lib/types/user.ts             (shared — User type)
  src/lib/types/session.ts          (shared — Session type)
  src/lib/auth/signup.ts            (auth/signup — business logic)
  src/app/(auth)/signup/page.tsx    (auth/signup — page)
  src/app/(auth)/signup/actions.ts  (auth/signup — server actions)
  src/components/auth/SignupForm.tsx (auth/signup — form component)
  src/lib/auth/login.ts             (auth/login — business logic)
  ...
```

Use this manifest to:
- Prevent duplicate file creation
- Enable cross-feature imports
- Build the final summary

### Rule 5: FDL trace comments

Every generated file includes trace comments back to the blueprint:
```typescript
// FDL: auth/login — business logic
// FDL outcome: rate_limited (priority: 1)
// FDL outcome: account_locked (priority: 2)
// FDL outcome: invalid_credentials (priority: 4)
// FDL outcome: successful_login (priority: 10)
```

---

## Non-Negotiable Rules

1. **PLAN BEFORE CODE — ABSOLUTE GATE.** Before writing a SINGLE line of code, you MUST: (a) read all blueprints from disk, (b) match the best ones to the user's request, (c) write a full plan with grouped suggestions (core, required, recommended, optional), (d) present missing blueprint suggestions (gaps), and (e) get explicit user approval on the plan. NO CODE until the plan is approved. This is the #1 rule.
2. **Document the entire system at the end.** After all code is generated, produce comprehensive system documentation covering: architecture overview, all features and how they connect, API endpoints, data models, environment variables, setup instructions, and a feature map showing which blueprints powered which parts of the system.
3. **Security constraints are mandatory.** If a blueprint says `constant_time: true`, use bcrypt.compare — not `===`. If it says `generic_message: true`, return identical errors for wrong-user and wrong-password. No exceptions.
4. **Every outcome must have a code path.** If the blueprint says it can happen, the generated code must handle it.
5. **Blueprint values are authoritative.** If a blueprint says `max_attempts: 5`, use 5. Don't substitute your own values.
6. **Never show YAML.** Everything is plain English. The user doesn't know blueprints exist.
7. **Always explain WHY.** Every suggestion has a reason. Not "Adding tax-engine" but "Adding tax-engine because POS order lines need tax computation — without it, totals will be wrong."
8. **Respect the user's final choices.** After warning about missing features, accept if the user says skip. Warn once, then move on. Don't nag.
9. **Maximum 2 suggestion rounds.** Don't keep discovering new suggestions endlessly. Two rounds of the checklist, then proceed to generation.
10. **Generate working code.** The output should run after `npm install && npm run dev` (or equivalent). Include all imports, config files, and integration glue.
11. **Add FDL trace comments.** Every generated file has `// FDL: {feature}/{outcome}` comments for traceability.
12. **Outcomes over flows.** When a blueprint has both outcomes and flows, generate code from outcomes. Flows are for human documentation.
