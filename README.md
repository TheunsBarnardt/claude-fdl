# Feature Definition Language (FDL)

**Define what your software should do. Let AI build it.**

FDL is a system for writing "blueprints" — plain-language specifications that describe software features. You write the what (rules, data, expected outcomes). Any AI tool reads the blueprint and generates the complete implementation for your chosen language and framework.

No code. No YAML knowledge. Just describe what you need.

---

## What Problems Does This Solve?

**Problem 1: Every developer rebuilds the same features from scratch.**
Login, signup, password reset, file upload, CRUD — these features exist in every app. Every time they're rebuilt, something gets missed. Rate limiting. Account lockout. Email verification. Proper error messages.

**Problem 2: When you ask AI to "build login", it guesses.**
Different AI tools produce different results. One includes rate limiting, another doesn't. One handles account lockout, another ignores it. There's no shared definition of what "login" actually needs.

**Problem 3: Business rules live in people's heads.**
The expense approval policy is in a PDF somewhere. The onboarding process is in a wiki. The checkout flow is in someone's memory. When it's time to build or update the software, critical rules get lost in translation.

**FDL solves all three.** A blueprint is the single source of truth for a feature — what data it needs, what rules govern it, what should happen in every scenario (success and failure), and how it connects to other features.

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

## The Three Commands

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

**Why outcomes are better for AI:** When you tell Claude *what* must be true instead of *how* to do it, it picks the best implementation for your specific framework. Outcomes are like acceptance criteria — flows are like recipes.

**When to use flows:** For business processes where humans need documented procedures (expense approvals, employee onboarding, support ticket escalation).

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

FDL comes with a starter set of blueprints you can use, modify, or learn from:

### Auth Pack (ready to use)

| Blueprint | Description |
|-----------|-------------|
| `login` | Email + password authentication with rate limiting, account lockout, session management |
| `signup` | User registration with email verification, password requirements, enumeration prevention |
| `password-reset` | Two-step reset via email with secure tokens, session invalidation |

### Workflow Example

| Blueprint | Description |
|-----------|-------------|
| `expense-approval` | Full business process: submit, manager review, finance approval, payment. Includes actors, state machine, SLAs |

### Recreating the Blueprints

If you want to start fresh or create your own version of these blueprints:

```
/fdl-create login auth
/fdl-create signup auth
/fdl-create password-reset auth
/fdl-create expense-approval workflow
```

Claude will ask you questions and generate each one. Your answers shape the blueprint — so you can customize the rules (different lockout thresholds, different password requirements, different approval chains) without editing YAML.

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

### Example 3: Build a complete auth system

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
  scripts/
    validate.js                # Validates blueprints are well-formed
  .claude/
    skills/
      fdl-create/              # Create blueprints from conversation
      fdl-extract/             # Extract blueprints from documents
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

**Does this only work with Claude?**
No. The blueprints are standard YAML files — any AI tool can read them. You can paste a blueprint into ChatGPT, Copilot, Gemini, or any other AI and ask it to generate code. The `/fdl-create`, `/fdl-extract`, and `/fdl-generate` slash commands are Claude Code skills that make the experience smoother, but the blueprints themselves are AI-agnostic.

**What languages and frameworks are supported?**
All of them. Blueprints describe what the feature does, not how to build it. Any language, any framework: Next.js, Express, Laravel, Angular, React, Vue, C#/.NET, Rust, Python/Django, Go, Ruby on Rails, Flutter, Swift, and anything else. Some blueprints include optional `extensions` with hints for specific frameworks, but they're not required.

**Can I use this for business processes, not just UI features?**
Yes. Blueprints support actors (who does what), state machines (status lifecycles), SLAs (time limits), and approval chains. The expense-approval blueprint is a full example.

**Can I extract rules from existing documents?**
Yes. `/fdl-extract` reads PDFs, Word docs, text files, and even images of flowcharts. It extracts the rules and creates a blueprint, with references back to the source document.

**How is this different from just asking AI to "build login"?**
Without FDL, the AI guesses what "login" means. With FDL, there's a complete specification: 5 failed attempts = lockout, 15-minute duration, constant-time password comparison, generic error messages to prevent user enumeration, JWT with 15-minute access tokens. Nothing is left to chance. Every AI tool gets the same spec and produces consistent results.

---

## License

MIT
