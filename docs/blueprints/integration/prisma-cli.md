---
title: "Prisma Cli Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "CLI tools for schema validation, formatting, generation, and database introspection. 4 fields. 8 outcomes. 4 error codes. rules: format, validate, generate"
---

# Prisma Cli Blueprint

> CLI tools for schema validation, formatting, generation, and database introspection

| | |
|---|---|
| **Feature** | `prisma-cli` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | cli, schema-tools, developer-tools, prisma, introspection |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/prisma-cli.blueprint.yaml) |
| **JSON API** | [prisma-cli.json]({{ site.baseurl }}/api/blueprints/integration/prisma-cli.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `developer` | Developer | human |  |
| `cli` | Prisma CLI | system |  |
| `schema_engine` | Schema Engine | system |  |
| `database` | Database | external |  |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `command` | select | Yes | CLI Command |  |
| `schema_path` | text | No | Schema File Path |  |
| `database_url` | password | No | Database Connection String |  |
| `output_path` | text | No | Output Directory |  |

## Rules

- **format:** prisma format: auto-formats schema file, Non-destructive, idempotent operation, Enforces Prisma style conventions, Can integrate with pre-commit hooks
- **validate:** prisma validate: checks schema syntax and semantics, Validates model definitions and field types, Validates datasource and generator configurations, Reports all errors at once
- **generate:** prisma generate: generates Prisma Client, Produces type-safe query builder, Can output to custom directories, Integrates with build tools
- **init:** prisma init: bootstraps new Prisma project, Creates schema file with datasource and generator, Optionally introspects existing database, Creates .env file for credentials
- **studio:** prisma studio: visual database GUI, Browse and edit data in browser, Available at http://localhost:5555, Requires active database connection

## Outcomes

### Schema_formatted (Priority: 1)

**Given:**
- command is format
- Schema file exists

**Then:**
- Schema file reformatted for consistency
- schema.formatted event emitted

**Result:** Schema file auto-formatted consistently

### Schema_validated (Priority: 1)

**Given:**
- command is validate
- All models and fields valid

**Then:**
- schema.validated event emitted

**Result:** Validation passed; schema is ready

### Project_initialized (Priority: 1)

**Given:**
- command is init
- No existing schema

**Then:**
- Project scaffold created with schema file
- project.initialized event emitted

**Result:** Prisma project scaffold created

### Studio_launched (Priority: 1)

**Given:**
- command is studio
- Database is reachable
- Schema is valid

**Then:**
- studio.launched event emitted

**Result:** Prisma Studio running at http://localhost:5555

### Client_generated (Priority: 2)

**Given:**
- command is generate
- Schema is valid

**Then:**
- Prisma Client generated to output directory
- client.generated event emitted

**Result:** Prisma Client generated with full types

### Schema_introspected (Priority: 2)

**Given:**
- command is init
- Database is reachable
- Database contains tables

**Then:**
- Schema auto-generated from database tables
- schema.introspected event emitted

**Result:** Schema auto-generated from existing database

### Schema_syntax_error (Priority: 10) — Error: `SCHEMA_SYNTAX_ERROR`

**Given:**
- Schema has syntax errors

**Then:**
- **emit_event** event: `validation.failed`

**Result:** Errors reported with line numbers

### Database_unreachable (Priority: 11) — Error: `DATABASE_UNREACHABLE`

**Given:**
- Cannot connect to database

**Then:**
- **emit_event** event: `connection.failed`

**Result:** Connection error with helpful message

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `SCHEMA_SYNTAX_ERROR` | 400 | Syntax error at line {line}: {error} | No |
| `SCHEMA_SEMANTIC_ERROR` | 400 | Error in schema definition: {error} | No |
| `DATABASE_UNREACHABLE` | 503 | Could not connect to database: {error} | No |
| `GENERATION_FAILED` | 500 | Code generation failed: {error} | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `schema.formatted` | Schema file has been formatted | `lines_modified`, `formatting_time_ms` |
| `schema.validated` | Schema has been validated | `model_count`, `validation_time_ms` |
| `client.generated` | Prisma Client has been generated | `generation_time_ms`, `output_path`, `type_count` |
| `project.initialized` | Prisma project has been initialized | `database_provider`, `initialization_time_ms` |
| `schema.introspected` | Database has been introspected | `model_count`, `table_count`, `relation_count` |
| `studio.launched` | Prisma Studio has been launched | `port`, `startup_time_ms` |
| `validation.failed` | Schema validation failed | `error_count`, `errors` |
| `connection.failed` | Database connection failed | `error_code`, `error_message` |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| prisma-schema | required | Schema must exist before CLI operations |
| prisma-migrations | recommended | CLI tools support migration workflow |
| prisma-crud | recommended | CLI generates types for CRUD operations |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
tech_stack:
  language: TypeScript / CLI
  framework: Prisma CLI
  database: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, MariaDB
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Prisma Cli Blueprint",
  "description": "CLI tools for schema validation, formatting, generation, and database introspection. 4 fields. 8 outcomes. 4 error codes. rules: format, validate, generate",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "cli, schema-tools, developer-tools, prisma, introspection"
}
</script>
