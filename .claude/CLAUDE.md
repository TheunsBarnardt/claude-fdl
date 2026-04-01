# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Feature Definition Language (FDL)** — a framework-agnostic specification for defining software features as YAML blueprints. AI tools (Claude Code, Copilot, etc.) read these blueprints to generate correct, complete implementations for any tech stack.

## Commands

```bash
# Validate all blueprints
node scripts/validate.js

# Validate a single blueprint
node scripts/validate.js blueprints/auth/login.blueprint.yaml

# Watch mode validation
npm run validate:watch

# Run tests (when test files exist)
node --test tests/
```

## Architecture

Three-layer system where skills consume blueprints validated by the schema:

```
Skill Layer (.claude/skills/)    — Claude Code skills that create/generate from blueprints
Blueprint Layer (blueprints/)    — YAML feature definitions organized by category
Schema Layer (schema/)           — Meta-schema that validates all blueprints
```

- **Schema:** `schema/blueprint.schema.yaml` is the meta-schema. `scripts/validate.js` embeds a JSON Schema equivalent and uses AJV for validation. Two validation passes: file-level (structure) then cross-reference (relationship targets exist).
- **Blueprints:** `blueprints/{category}/{feature}.blueprint.yaml` — self-contained feature specs. Current categories in schema: auth, data, access, ui, integration, notification, payment, workflow.
- **Skills:** `/fdl-create` generates new blueprint YAML from a feature description. `/fdl-generate` produces implementation code from a blueprint for any language or framework. `/fdl-extract` reads a document (PDF, DOCX, etc.) and extracts rules into a blueprint. All skills are conversational — users don't need to know YAML.

## Blueprint Structure

Required top-level fields: `feature`, `version`, `description`, `category`, `rules`
Conditionally required: `outcomes` and/or `flows` — at least one must be present
Optional: `fields` (omit for system-driven features), `tags`, `related`, `events`, `errors`, `actors`, `states`, `sla`, `ui_hints`, `extensions`

### Outcomes vs Flows

A blueprint must have at least one of `outcomes` or `flows` (or both).

- **`outcomes`** (preferred for code generation) — acceptance criteria in given/then/result format. Tells AI **what must be true**, not how to do it. Best for generating implementation code.
- **`flows`** (preferred for business process documentation) — step-by-step procedures with actors and conditions. Tells humans **what steps to follow**. Best for workflow documentation.

Use `outcomes` alone for technical features (login, CRUD, checkout). Use both for business processes where humans need documented procedures (approvals, onboarding).

### Structured Conditions in Outcomes

Conditions in `given` can be plain-text strings OR structured objects. Structured conditions are machine-parseable:

```yaml
# Plain text (human-readable, AI-interpreted)
- "user is authenticated"

# Structured (machine-parseable, deterministic)
- field: amount
  source: input        # where the data comes from
  operator: gt
  value: 1000
  description: "Expense exceeds finance approval threshold"

# AND/OR grouping
- any:                  # OR — at least one must be true
    - field: user
      source: db
      operator: not_exists
    - field: password
      source: input
      operator: neq
      value: stored_hash
```

**Operators:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `matches`, `exists`, `not_exists`
**Data sources:** `input` (form/request body), `db` (database), `request` (HTTP metadata), `session`, `system`, `computed`
**Logic:** Top-level given[] items are AND. Use `any:` for OR groups, `all:` for nested AND groups.

### Structured Side Effects in Outcomes

Side effects in `then` can also be structured:

```yaml
then:
  - action: set_field
    target: failed_login_attempts
    value: 0
  - action: emit_event
    event: login.success
    payload: [user_id, email, timestamp]
  - action: transition_state
    field: status
    from: submitted
    to: approved
```

**Actions:** `set_field`, `emit_event`, `transition_state`, `notify`, `invalidate`, `create_record`, `delete_record`, `call_service`

### Outcome Priority

Outcomes have an optional `priority` (number) that defines evaluation order. Lower = checked first:

```yaml
rate_limited:    { priority: 1 }   # checked first
account_locked:  { priority: 2 }   # then this
successful:      { priority: 10 }  # last resort
```

### Workflow / Business Process Fields

- **`actors`** — who participates (human roles, systems, external parties). Each actor has `id`, `name`, `type` (human/system/external), optional `description` and `role`.
- **`states`** — state machine definition. Defines `field` (which field holds state), `values` (valid statuses with initial/terminal markers), and `transitions` (allowed moves with actor, condition, and description).
- **`sla`** — time constraints on transitions or overall process (e.g., "manager must review within 48h"). Includes `max_duration` and `escalation` rules.

### Naming Conventions

| Element    | Convention       | Example                      |
|------------|------------------|------------------------------|
| Features   | kebab-case       | `password-reset`             |
| Fields     | snake_case       | `first_name`                 |
| Error codes| UPPER_SNAKE_CASE | `LOGIN_INVALID_CREDENTIALS`  |
| Events     | dot.notation     | `login.success`              |
| Actors     | snake_case       | `finance_manager`            |
| Files      | `{feature}.blueprint.yaml` | `login.blueprint.yaml` |

### Field Types

text, email, password, number, boolean, date, datetime, phone, url, file, select, multiselect, hidden, token, rich_text, json

### Relationship Types

- `required` — feature cannot work without this
- `recommended` — should have
- `optional` — nice to have
- `extends` — builds on another feature

## Validation

`scripts/validate.js` (~350 lines) does two things:
1. Parses each YAML blueprint and validates against the embedded JSON Schema (AJV with ajv-formats)
2. Cross-references `related` entries to confirm target blueprints exist

When adding fields to the schema, you must update **both** `schema/blueprint.schema.yaml` (source of truth) and the `blueprintJsonSchema` object in `scripts/validate.js` (the machine-readable equivalent used at runtime).

## Rules

- YAML is the source of truth — never edit generated files
- Comments in YAML should explain WHY (security reasons, best practices)
- Error messages must be user-safe (never leak internal state)
- Security rules use OWASP recommendations as defaults
- All fields need validation — no unvalidated inputs
- Every blueprint must define outcomes or flows (or both) covering success and error scenarios
- When creating a new blueprint, update `related` arrays in existing blueprints that should reference it
