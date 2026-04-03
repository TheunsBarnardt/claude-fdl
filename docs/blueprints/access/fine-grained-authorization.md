---
title: "Fine Grained Authorization Blueprint"
layout: default
parent: "Access Control"
grand_parent: Blueprint Catalog
description: "Resource-based and policy-based authorization. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# Fine Grained Authorization Blueprint

> Resource-based and policy-based authorization

| | |
|---|---|
| **Feature** | `fine-grained-authorization` |
| **Category** | Access Control |
| **Version** | 1.0.0 |
| **Tags** | authorization, rbac |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/access/fine-grained-authorization.blueprint.yaml) |
| **JSON API** | [fine-grained-authorization.json]({{ site.baseurl }}/api/blueprints/access/fine-grained-authorization.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `resource_id` | text | Yes | Resource ID | Validations: required |
| `scope_name` | text | Yes | Scope | Validations: required |

## Rules

- **core:** Authorization policy evaluation

## Outcomes

### Access_granted (Priority: 5)

**Given:**
- `resource_id` exists `null`

**Then:**
- **emit_event** event: `authz.granted`

**Result:** Access granted

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `ACCESS_DENIED` | 403 | Access denied | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `authz.granted` | Authorization granted | `resource_id` |

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
  "name": "Fine Grained Authorization Blueprint",
  "description": "Resource-based and policy-based authorization. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "authorization, rbac"
}
</script>
