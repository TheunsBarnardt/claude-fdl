---
title: "User Consent Management Blueprint"
layout: default
parent: "Access Control"
grand_parent: Blueprint Catalog
description: "OAuth/OIDC consent tracking and enforcement. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# User Consent Management Blueprint

> OAuth/OIDC consent tracking and enforcement

| | |
|---|---|
| **Feature** | `user-consent-management` |
| **Category** | Access Control |
| **Version** | 1.0.0 |
| **Tags** | consent, oauth2 |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/access/user-consent-management.blueprint.yaml) |
| **JSON API** | [user-consent-management.json]({{ site.baseurl }}/api/blueprints/access/user-consent-management.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `client_id` | text | Yes | Client ID | Validations: required |
| `scope` | text | Yes | Scope | Validations: required |

## Rules

- **core:** Consent enforcement

## Outcomes

### Consent_granted (Priority: 5)

**Given:**
- `client_id` exists `null`

**Then:**
- **emit_event** event: `consent.granted`

**Result:** Consent recorded

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `CONSENT_DENIED` | 403 | Consent denied | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `consent.granted` | Consent granted | `client_id` |

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
  "name": "User Consent Management Blueprint",
  "description": "OAuth/OIDC consent tracking and enforcement. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "consent, oauth2"
}
</script>
