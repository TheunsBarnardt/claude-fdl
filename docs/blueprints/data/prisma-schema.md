---
title: "Prisma Schema Blueprint"
layout: default
parent: "Data"
grand_parent: Blueprint Catalog
description: "Define application data models with fields, types, relationships, and validation rules in Prisma schema. 7 fields. 3 outcomes. 3 error codes. rules: naming, val"
---

# Prisma Schema Blueprint

> Define application data models with fields, types, relationships, and validation rules in Prisma schema

| | |
|---|---|
| **Feature** | `prisma-schema` |
| **Category** | Data |
| **Version** | 1.0.0 |
| **Tags** | schema, models, orm, data-modeling, prisma |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/data/prisma-schema.blueprint.yaml) |
| **JSON API** | [prisma-schema.json]({{ site.baseurl }}/api/blueprints/data/prisma-schema.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `developer` | Developer | human |  |
| `schema_engine` | Schema Engine | system |  |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `model_name` | text | Yes | Model Name |  |
| `field_name` | text | Yes | Field Name |  |
| `field_type` | select | Yes | Field Type |  |
| `is_required` | boolean | Yes | Is Required |  |
| `is_unique` | boolean | Yes | Is Unique |  |
| `default_value` | text | No | Default Value |  |
| `relation_type` | select | No | Relation Type |  |

## States

**State field:** `model_status`

**Values:**

| State | Initial | Terminal |
|-------|---------|----------|
| `defined` | Yes |  |
| `generated` |  |  |
| `migrated` |  |  |

## Rules

- **naming:** Models: PascalCase (User, BlogPost, OrderItem), Fields: camelCase (firstName, emailAddress, createdAt), Enums: UPPER_SNAKE_CASE values (ACTIVE, PENDING, ARCHIVED)
- **validation:** Required fields cannot be null in database, Unique constraints prevent duplicate values, Default values must match field type, Relations must reference existing models
- **relationships:** One-to-one: unique constraint on foreign key, One-to-many: implicit foreign key in child model, Many-to-many: automatic join table created, Cascade delete propagates to related records

## Outcomes

### Model_defined (Priority: 1)

**Given:**
- Schema block contains valid model definition
- All fields have supported types

**Then:**
- Model definition stored in schema
- model.defined event emitted

**Result:** Model definition stored and validated

### Schema_validated (Priority: 1)

**Given:**
- All models syntactically valid
- All relations reference existing models

**Then:**
- schema.validated event emitted

**Result:** Schema ready for client generation

### Invalid_type_error (Priority: 10) — Error: `INVALID_FIELD_TYPE`

**Given:**
- Field uses unsupported type

**Result:** Validation error: type not supported

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_FIELD_TYPE` | 400 | Field type '{type}' is not supported | No |
| `INVALID_RELATION` | 400 | Relation references non-existent model | No |
| `SYNTAX_ERROR` | 400 | Schema syntax error at line {line}: {error} | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `model.defined` | Model definition created | `name`, `field_count`, `relation_count` |
| `schema.validated` | Schema passed validation | `model_count`, `field_count`, `validation_time_ms` |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| prisma-migrations | recommended | Schema must be migrated to create database |
| prisma-crud | recommended | Models are queried via CRUD operations |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
tech_stack:
  language: TypeScript / Prisma Schema DSL
  framework: Prisma ORM
  database: PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, MariaDB
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Prisma Schema Blueprint",
  "description": "Define application data models with fields, types, relationships, and validation rules in Prisma schema. 7 fields. 3 outcomes. 3 error codes. rules: naming, val",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "schema, models, orm, data-modeling, prisma"
}
</script>
