---
title: "User Authentication Session Management Blueprint"
layout: default
parent: "Auth"
grand_parent: Blueprint Catalog
description: "Authentication flows, session management, brute-force protection. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# User Authentication Session Management Blueprint

> Authentication flows, session management, brute-force protection

| | |
|---|---|
| **Feature** | `user-authentication-session-management` |
| **Category** | Auth |
| **Version** | 1.0.0 |
| **Tags** | authentication, sessions |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/auth/user-authentication-session-management.blueprint.yaml) |
| **JSON API** | [user-authentication-session-management.json]({{ site.baseurl }}/api/blueprints/auth/user-authentication-session-management.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `username` | text | Yes | Username | Validations: required |
| `password` | password | Yes | Password | Validations: required |

## Rules

- **core:** Authentication and session lifecycle

## Outcomes

### Auth_success (Priority: 5)

**Given:**
- `username` exists `null`

**Then:**
- **emit_event** event: `auth.success`

**Result:** User authenticated

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_CREDENTIALS` | 401 | Invalid credentials | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `auth.success` | Authentication successful | `username` |

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
  "name": "User Authentication Session Management Blueprint",
  "description": "Authentication flows, session management, brute-force protection. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "authentication, sessions"
}
</script>
