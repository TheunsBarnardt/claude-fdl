---
title: "Prisma Migrations Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Manage database schema versioning and evolution with safe migrations. 4 fields. 5 outcomes. 4 error codes. rules: development, production, safety"
---

# Prisma Migrations Blueprint

> Manage database schema versioning and evolution with safe migrations

| | |
|---|---|
| **Feature** | `prisma-migrations` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | migrations, database, schema-evolution, deployment, versioning |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/prisma-migrations.blueprint.yaml) |
| **JSON API** | [prisma-migrations.json]({{ site.baseurl }}/api/blueprints/data/prisma-migrations.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `developer` | Developer | human |  |
| `ci_cd_pipeline` | CI/CD Pipeline | system |  |
| `migrations_engine` | Migrations Engine | system |  |
| `database` | Database | external |  |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `command` | select | Yes | Migration Command |  |
| `migration_name` | text | No | Migration Name |  |
| `create_only` | boolean | No | Create Only (Don't Apply) |  |
| `force_reset` | boolean | No | Force Reset (Destructive) |  |

## States

**State field:** `migration_state`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|
| `pending` | Yes |  |
| `applied` |  |  |
| `failed` |  |  |
| `conflict` |  |  |

## Rules

- **development:** migrate dev: create from schema changes, apply, regenerate client, Creates safe migration using shadow database, Auto-detects data loss and prompts for confirmation, Regenerates Prisma Client with new types
- **production:** migrate deploy: apply pending migrations in order, Requires explicit --force for destructive operations, All migrations applied atomically, Prevents deployment if pending migrations exist
- **safety:** Shadow database validates changes before applying, Automatic detection of schema conflicts, migrate resolve for conflict resolution, Data loss warnings before destructive operations

## Outcomes

### Migration_created (Priority: 1)

**Given:**
- command is migrate_dev
- Schema has changes since last migration

**Then:**
- Migration SQL file created with timestamp
- migration.created event emitted

**Result:** Migration SQL file generated

### Migration_applied (Priority: 2) | Transaction: atomic

**Given:**
- Migration SQL is valid
- Database constraints can be satisfied

**Then:**
- Migration marked as applied
- migration.applied event emitted

**Result:** Migration executed; schema updated

### Client_regenerated (Priority: 3)

**Given:**
- Migration applied successfully

**Then:**
- client.generated event emitted

**Result:** Prisma Client regenerated with new types

### Migration_conflict (Priority: 10) — Error: `MIGRATION_CONFLICT`

**Given:**
- Two migrations from same base state both applied

**Then:**
- **emit_event** event: `migration.conflict`

**Result:** Error: run prisma migrate resolve

### Data_loss_warning (Priority: 11) — Error: `DATA_LOSS_DETECTED`

**Given:**
- Migration would drop columns or data
- User has not confirmed data loss

**Result:** Error: confirm with --accept-data-loss flag

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `MIGRATION_CONFLICT` | 409 | Migrations {a} and {b} conflict. Run: prisma migrate resolve | No |
| `DATA_LOSS_DETECTED` | 400 | This migration removes data. Confirm with --accept-data-loss | No |
| `MIGRATION_FAILED` | 500 | Migration failed: {error} | No |
| `DATABASE_UNREACHABLE` | 503 | Could not connect to database | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `migration.created` | Migration file created | `name`, `timestamp`, `changes` |
| `migration.applied` | Migration applied to database | `name`, `applied_at`, `duration_ms` |
| `migration.conflict` | Migration conflict detected | `migration_a`, `migration_b` |
| `client.generated` | Prisma Client regenerated | `timestamp`, `type_count` |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| prisma-schema | required | Schema changes drive migrations |
| prisma-crud | required | Migrations create tables for CRUD operations |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
tech_stack:
  language: TypeScript / SQL
  framework: Prisma Migrate
  database: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, MariaDB
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Prisma Migrations Blueprint",
  "description": "Manage database schema versioning and evolution with safe migrations. 4 fields. 5 outcomes. 4 error codes. rules: development, production, safety",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "migrations, database, schema-evolution, deployment, versioning"
}
</script>
