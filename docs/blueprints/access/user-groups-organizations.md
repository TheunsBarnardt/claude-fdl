---
title: "User Groups Organizations Blueprint"
layout: default
parent: "Access Control"
grand_parent: Blueprint Catalog
description: "Hierarchical groups with role inheritance. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# User Groups Organizations Blueprint

> Hierarchical groups with role inheritance

| | |
|---|---|
| **Feature** | `user-groups-organizations` |
| **Category** | Access Control |
| **Version** | 1.0.0 |
| **Tags** | groups, organizations |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/access/user-groups-organizations.blueprint.yaml) |
| **JSON API** | [user-groups-organizations.json]({{ site.baseurl }}/api/blueprints/access/user-groups-organizations.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `group_id` | text | Yes | Group ID | Validations: required |
| `group_name` | text | Yes | Group Name | Validations: required |

## Rules

- **core:** Group hierarchy and role inheritance

## Outcomes

### Group_created (Priority: 5)

**Given:**
- `group_name` exists `null`

**Then:**
- **emit_event** event: `group.created`

**Result:** Group created

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `GROUP_NOT_FOUND` | 404 | Group not found | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `group.created` | Group created | `group_id` |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
source:
  repo: https://github.com/keycloak/keycloak
  project: Keycloak
  tech_stack: Java
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "User Groups Organizations Blueprint",
  "description": "Hierarchical groups with role inheritance. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "groups, organizations"
}
</script>
