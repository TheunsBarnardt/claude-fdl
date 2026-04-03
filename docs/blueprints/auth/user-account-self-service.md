---
title: "User Account Self Service Blueprint"
layout: default
parent: "Auth"
grand_parent: Blueprint Catalog
description: "User self-service account and credential management. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# User Account Self Service Blueprint

> User self-service account and credential management

| | |
|---|---|
| **Feature** | `user-account-self-service` |
| **Category** | Auth |
| **Version** | 1.0.0 |
| **Tags** | account-management |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/auth/user-account-self-service.blueprint.yaml) |
| **JSON API** | [user-account-self-service.json]({{ site.baseurl }}/api/blueprints/auth/user-account-self-service.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `email` | email | Yes | Email | Validations: required, email |
| `current_password` | password | Yes | Current Password | Validations: required |

## Rules

- **core:** Account self-service operations

## Outcomes

### Profile_updated (Priority: 5)

**Given:**
- `email` exists `null`

**Then:**
- **emit_event** event: `account.updated`

**Result:** Profile updated

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_PASSWORD` | 401 | Invalid password | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `account.updated` | Account updated | `user_id` |

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
  "name": "User Account Self Service Blueprint",
  "description": "User self-service account and credential management. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "account-management"
}
</script>
