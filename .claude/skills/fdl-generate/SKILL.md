---
name: fdl-generate
description: Generate implementation code from an FDL blueprint for a specific framework
user_invocable: true
command: fdl-generate
arguments: "<feature> <framework>"
---

# FDL Generate — Code Generation from Blueprints

Generate a complete implementation from an FDL blueprint. Your job is to produce code that **satisfies every outcome** in the blueprint. The outcomes tell you WHAT must be true — you decide HOW to implement it for the target framework.

## Usage

```
/fdl-generate login nextjs
/fdl-generate signup laravel
/fdl-generate password-reset express
/fdl-generate login angular
/fdl-generate signup csharp
/fdl-generate expense-approval rust
```

## Arguments

- `<feature>` — The blueprint feature name (e.g., `login`, `signup`, `password-reset`)
- `<framework>` — Target language or framework (e.g., `nextjs`, `express`, `laravel`, `angular`, `csharp`, `rust`, `python`, `go`, `flutter`, or any other)

## How to Think About Code Generation

**DO NOT treat this as a recipe to follow step by step.**

Instead, think of it like this:
1. Read the `outcomes` — these are your acceptance criteria
2. Read the `rules` — these are your constraints (security, business logic)
3. Read the `fields` — these are your data model
4. Read the `errors` — these are the error responses you must return
5. Now write the code that makes ALL of it true, using the best patterns for the target framework

The blueprint tells you WHAT. You decide HOW based on the framework.

## Conversation with the User (max 2 questions)

Use AskUserQuestion. Only ask what changes the generated code.

**Question 1 — Scope** (if there are related features):
"Generate just {feature}, or include related features?"
- "{feature} only"
- "Include required features too ({list})"
- "Include all related features ({list})"

**Question 2 — Database** (if the feature needs persistence):
"How should I handle the database?"
- "Use mock/demo data (I'll swap in a real database later)"
- "Prisma (PostgreSQL)"
- "Drizzle (PostgreSQL)"
- "MongoDB/Mongoose"

Skip if frontend-only. Don't ask more questions — use smart defaults.

## Code Generation: Outcome-Driven Approach

For each outcome in the blueprint, your generated code must:

1. **Check every `given` condition** — these become guards/validations in your code
2. **Perform every `then` action** — these become the side effects (DB writes, events, notifications)
3. **Produce the `result`** — this becomes the response (redirect, error message, return value)

### Example: Translating an Outcome to Code

**Blueprint outcome:**
```yaml
invalid_credentials:
  given:
    - user not found OR password does not match
  then:
    - failed attempt counter is incremented
    - if attempts reach 5, account is locked for 15 minutes
    - login.failed event is emitted
  result: show "Invalid email or password" (SAME message for both cases)
```

**Generated Next.js code (your implementation chooses the HOW):**
```typescript
// FDL outcome: invalid_credentials
// Given: user not found OR password does not match
if (!user) {
  await emitLoginFailed({ email: normalizedEmail, reason: "user_not_found", ... });
  return { success: false, error: AUTH_ERRORS.LOGIN_INVALID_CREDENTIALS };
}

const passwordValid = await compare(input.password, user.password_hash);
if (!passwordValid) {
  // Then: attempt counter incremented, lock if >= 5
  const newAttempts = user.failed_login_attempts + 1;
  const lockUntil = newAttempts >= MAX_ATTEMPTS
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
    : null;
  await updateLoginAttempts(user.id, newAttempts, lockUntil);

  // Then: login.failed event emitted
  await emitLoginFailed({ email: normalizedEmail, reason: "invalid_password", ... });

  // Result: SAME error message (enumeration prevention)
  return { success: false, error: AUTH_ERRORS.LOGIN_INVALID_CREDENTIALS };
}
```

Notice: the outcome said "increment counter" and "lock if >= 5" — the code implements those semantics using whatever patterns make sense for the framework. The outcome didn't say "call updateLoginAttempts" — that's the code's choice.

## What to Generate

For each feature, produce these files (adapt to framework conventions):

**Backend:**
- Business logic — the core: every outcome becomes a code path
- Validation — server-side, from `fields[].validation`
- Types — interfaces from `fields`, `errors`, `events`
- Route/action — the entry point that calls business logic

**Frontend (when ui_hints exist):**
- Form component — fields from `fields`, client validation, accessibility
- Page — renders the form with layout from `ui_hints`
- Error handling — maps error codes to user-facing messages

**Don't generate:**
- Tests (unless the user asks)
- Documentation (the blueprint IS the documentation)
- Migration files (the user handles their own DB schema)

## Self-Check: Outcome Coverage

After generating ALL code, verify every outcome is covered. Go through each one:

```
outcomes.successful_login:
  given: email valid? ✓ (validation in validateLoginInput)
  given: user exists? ✓ (lookupUserByEmail check)
  given: password matches? ✓ (bcrypt.compare)
  given: not locked? ✓ (locked_until check)
  given: not disabled? ✓ (status check)
  given: email verified? ✓ (email_verified check)
  then: reset counter? ✓ (updateLoginAttempts(0))
  then: create tokens? ✓ (createSession)
  then: emit event? ✓ (emitLoginSuccess)
  result: redirect /dashboard? ✓ (redirect in action)

outcomes.invalid_credentials:
  given: user not found or wrong password? ✓ (both return same error)
  then: increment counter? ✓
  then: lock if >= 5? ✓
  then: emit event? ✓
  result: same error message? ✓ (LOGIN_INVALID_CREDENTIALS for both)

[...continue for every outcome]
```

If ANY check fails, fix the code before outputting.

Also verify:
- Every `rules.security` constraint is enforced (rate limits, constant-time, etc.)
- Every `errors` entry has a code path that can trigger it
- Every `events` entry is emitted somewhere
- If `states` exists, transitions are enforced
- If `actors` exist, authorization checks match

## Output to User

Show a clean summary (no YAML, no implementation details):

```
Generated: login for Next.js (App Router)

FILES:
  src/app/(auth)/login/page.tsx          — Page
  src/app/(auth)/login/actions.ts        — Server action
  src/lib/auth/login.ts                  — Business logic
  src/lib/auth/types.ts                  — Types
  src/components/auth/LoginForm.tsx       — Form

IMPLEMENTED:
  ✓ Email + password login with "remember me"
  ✓ Account lockout after 5 failed attempts (15 min)
  ✓ Rate limiting (10 req/min per IP)
  ✓ Generic error messages (enumeration prevention)
  ✓ JWT session with 15-min access + 7-day refresh token
  ✓ Secure cookies (httpOnly, secure, sameSite: strict)
  ✓ 4 events emitted (success, failed, locked, unverified)

NEEDS YOUR WORK:
  ⚠ Database queries (using mock data — swap in your ORM)
  ⚠ Rate limiting store (needs Redis or similar)
  ⚠ Email sending (verification emails)

DEMO CREDENTIALS (mock data):
  Email: demo@example.com | Password: Password1
```

## Framework Patterns

Use the target framework's idiomatic file structure. Here are examples — but adapt to whatever the user asks for:

### Next.js (App Router)
```
src/app/{route}/page.tsx           — Server component (page)
src/app/{route}/actions.ts         — Server actions
src/lib/{category}/{feature}.ts    — Business logic
src/lib/{category}/types.ts        — Shared types
src/components/{category}/{Form}.tsx — Client form
```

### Express
```
src/routes/{category}/{feature}.ts     — Route + handler
src/services/{category}/{feature}.ts   — Business logic
src/validators/{category}/{feature}.ts — Zod/Joi validation
src/types/{category}.ts                — Types
```

### Laravel
```
app/Http/Controllers/{Category}/{Feature}Controller.php
app/Http/Requests/{Category}/{Feature}Request.php
app/Services/{Category}/{Feature}Service.php
resources/views/{category}/{feature}.blade.php
routes/{category}.php
```

### C# / ASP.NET
```
Controllers/{Category}/{Feature}Controller.cs
Services/{Category}/{Feature}Service.cs
Models/{Category}/{Feature}Request.cs
Models/{Category}/{Feature}Response.cs
```

### Angular
```
src/app/{category}/{feature}/{feature}.component.ts
src/app/{category}/{feature}/{feature}.component.html
src/app/{category}/{feature}/{feature}.service.ts
src/app/{category}/{feature}/{feature}.model.ts
```

### Rust (Actix / Axum)
```
src/handlers/{category}/{feature}.rs
src/services/{category}/{feature}.rs
src/models/{category}.rs
src/errors/{category}.rs
```

### Python (Django / FastAPI)
```
{category}/views.py or {category}/routes.py
{category}/services/{feature}.py
{category}/models.py
{category}/schemas.py
```

### Any Other Framework
Follow that framework's conventions. The blueprint gives you WHAT to build — you decide the file structure, naming patterns, and idioms that are standard for the target.

## Non-Negotiable Rules

1. **Security constraints are mandatory** — `constant_time: true` means bcrypt.compare, not `===`. `generic_message: true` means identical error for wrong-user and wrong-password. No exceptions.
2. **Every outcome must have a code path** — if the blueprint says it can happen, the code must handle it.
3. **Use blueprint values, not your own** — `max_attempts: 5` means 5, not 3 or 10.
4. **Add `// FDL: {path}` comments** — so developers can trace code back to the blueprint.
5. **Outcomes > flows** — when both exist, implement from outcomes. Flows are for documentation.
