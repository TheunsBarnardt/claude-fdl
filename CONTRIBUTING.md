# Contributing to FDL

Thanks for your interest in contributing to the Feature Definition Language! Whether you're submitting a new blueprint, improving the schema, fixing a bug, or adding a skill — every contribution helps the community build better software faster.

## Ways to Contribute

### Submit a New Blueprint

The most impactful way to contribute. Every blueprint you add gives every developer a production-ready specification they can generate code from.

1. Create your blueprint using `/fdl-create` or write YAML directly
2. Place it in `blueprints/{category}/{feature}.blueprint.yaml`
3. Run `node scripts/validate.js` to ensure it passes
4. Update `related` arrays in existing blueprints that should reference yours
5. Submit a PR

**Categories:** auth, data, access, ui, integration, notification, payment, workflow

**Good first blueprints to contribute:**
- `file-upload` (data) — chunked upload, virus scanning, size limits, type validation
- `roles-and-permissions` (access) — RBAC, role hierarchy, permission guards
- `notifications` (notification) — email, push, in-app with preferences and batching
- `search` (data) — full-text search, filters, facets, pagination
- `checkout` (payment) — cart, pricing, tax, payment processing, order lifecycle

### Extract a Blueprint from an Open-Source Project

Use `/fdl-extract-code` to reverse-engineer blueprints from popular open-source codebases. This captures real-world architectural patterns that help everyone.

### Improve the Schema

The meta-schema at `schema/blueprint.schema.yaml` defines what blueprints can contain. If you find a pattern that doesn't fit the current schema, propose an extension.

When modifying the schema, update **both**:
- `schema/blueprint.schema.yaml` (source of truth)
- The `blueprintJsonSchema` object in `scripts/validate.js` (runtime equivalent)

### Improve a Skill

Skills live in `.claude/skills/`. Each skill is a markdown file that instructs Claude Code how to perform a task. If you find a skill produces incorrect or incomplete results, improve its instructions.

### Fix Bugs or Improve Tooling

The validator (`scripts/validate.js`) and expression parser (`scripts/expression.js`) are the core tooling. Bug fixes and improvements are always welcome.

## Development Setup

```bash
git clone https://github.com/TheunsBarnardt/claude-fdl.git
cd claude-fdl
npm install

# Validate all blueprints
node scripts/validate.js

# Watch mode (re-validates on file changes)
npm run validate:watch

# Run tests
node --test tests/
```

## Blueprint Quality Checklist

Before submitting a blueprint PR, verify:

- [ ] Feature name is kebab-case
- [ ] Field names are snake_case
- [ ] Error codes are UPPER_SNAKE_CASE
- [ ] Event names use dot.notation
- [ ] Actor IDs are snake_case
- [ ] All required top-level fields are present (feature, version, description, category, rules)
- [ ] At least one of `outcomes` or `flows` is defined
- [ ] Both success and error scenarios are covered
- [ ] `node scripts/validate.js` passes with 0 failures
- [ ] Comments explain WHY, not what
- [ ] Security rules follow OWASP recommendations
- [ ] Error messages are user-safe (never leak internal state)

## Commit Messages

Follow the existing style:

```
Add {feature} blueprint for {category}
Add {skill-name} skill for {description}
Fix {what was broken} in {where}
Update {what} to {why}
```

## Code of Conduct

Be kind. Be constructive. Help others learn. We're all building something together.

## Questions?

Open a [GitHub Issue](https://github.com/TheunsBarnardt/claude-fdl/issues) or start a [Discussion](https://github.com/TheunsBarnardt/claude-fdl/discussions).
