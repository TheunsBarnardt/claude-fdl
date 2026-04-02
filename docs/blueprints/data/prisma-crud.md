---
title: "Prisma Crud Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Execute type-safe database CRUD operations with Prisma Client query builder. 5 fields. 9 outcomes. 4 error codes. rules: read_operations, write_operations, cons"
---

# Prisma Crud Blueprint

> Execute type-safe database CRUD operations with Prisma Client query builder

| | |
|---|---|
| **Feature** | `prisma-crud` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | crud, database, orm, prisma, query-builder |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/prisma-crud.blueprint.yaml) |
| **JSON API** | [prisma-crud.json]({{ site.baseurl }}/api/blueprints/data/prisma-crud.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `application_code` | Application | system |  |
| `prisma_client` | Prisma Client | system |  |
| `database` | Database | external |  |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `operation` | select | Yes | Operation Type |  |
| `model` | text | Yes | Model Name |  |
| `where_conditions` | json | No | Filter Conditions |  |
| `data` | json | No | Record Data |  |
| `include_relations` | boolean | No | Include Related Records |  |

## Rules

- **read_operations:** findUnique returns single record or null; requires unique field, findFirst returns first matching record; requires where clause, findMany returns array; supports pagination via skip/take, count returns total matching records, aggregate returns computed values, groupBy returns grouped results with aggregations
- **write_operations:** create inserts one record; returns created record with generated IDs, createMany batch creates; no auto-rollback on partial failure, update updates one record by ID; returns updated record, updateMany bulk updates matching criteria, upsert atomically creates or updates, delete removes one record; returns deleted record, deleteMany bulk deletes matching criteria
- **constraints:** Unique constraint violation: value already exists, Foreign key violation: related record missing, Type mismatch: wrong data type provided, NOT NULL violation: required field omitted
- **transactions:** Wrap multiple operations in $transaction for atomicity, All changes rolled back if any operation fails, Configurable timeout (default 5 seconds)

## Outcomes

### Record_found (Priority: 1)

**Given:**
- operation is find_unique or find_first
- where conditions match exactly one record

**Result:** Record returned with all fields or selected subset

### Record_created (Priority: 1) | Transaction: atomic

**Given:**
- operation is create
- All required fields provided
- No unique constraint violations

**Then:**
- New record inserted into database
- Auto-generated ID assigned
- Created and updated timestamps set
- record.created event emitted

**Result:** New record inserted with auto-generated ID and timestamps

### Multiple_records_found (Priority: 2)

**Given:**
- operation is find_many

**Result:** Array of matching records returned; empty array if no matches

### Record_updated (Priority: 2) | Transaction: atomic

**Given:**
- operation is update
- Record exists matching where clause

**Then:**
- Record updated with new values
- updatedAt timestamp set to current time
- record.updated event emitted

**Result:** Record updated; updatedAt timestamp set

### Record_upserted (Priority: 2) | Transaction: atomic

**Given:**
- operation is upsert

**Then:**
- Record created if not exists, updated if exists
- record.upserted event emitted with created flag

**Result:** Record created if not exists, updated if exists (atomic)

### Record_deleted (Priority: 3) | Transaction: atomic

**Given:**
- operation is delete
- No foreign key constraints prevent deletion

**Then:**
- Record removed from database
- record.deleted event emitted

**Result:** Record deleted from database

### Unique_constraint_violation (Priority: 20) — Error: `UNIQUE_CONSTRAINT_VIOLATION`

**Given:**
- Attempting to create/update with duplicate unique field value

**Result:** Operation fails; error indicates field with conflicting value

### Foreign_key_violation (Priority: 21) — Error: `FOREIGN_KEY_VIOLATION`

**Given:**
- Referencing non-existent record in relation

**Result:** Operation rejected; missing related record

### Record_not_found (Priority: 22) — Error: `NOT_FOUND`

**Given:**
- Using findOrThrow operation
- No record matches where clause

**Result:** NotFoundError thrown

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `UNIQUE_CONSTRAINT_VIOLATION` | 409 | Unique constraint failed on fields: {fields} | No |
| `FOREIGN_KEY_VIOLATION` | 400 | Foreign key constraint failed on relation: {relation} | No |
| `NOT_FOUND` | 404 | No {model} found | No |
| `VALIDATION_ERROR` | 400 | Invalid value for field {field}: {reason} | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `record.created` | A new record has been created | `model`, `id`, `created_at` |
| `record.updated` | A record has been updated | `model`, `id`, `updated_at` |
| `record.deleted` | A record has been deleted | `model`, `id`, `deleted_at` |
| `record.upserted` | A record has been created or updated | `model`, `id`, `created` |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| prisma-schema | required | Models must be defined before querying |
| prisma-migrations | required | Schema must be migrated to create database tables |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
tech_stack:
  language: TypeScript / JavaScript
  framework: Prisma Client
  database: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, MariaDB
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Prisma Crud Blueprint",
  "description": "Execute type-safe database CRUD operations with Prisma Client query builder. 5 fields. 9 outcomes. 4 error codes. rules: read_operations, write_operations, cons",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "crud, database, orm, prisma, query-builder"
}
</script>
