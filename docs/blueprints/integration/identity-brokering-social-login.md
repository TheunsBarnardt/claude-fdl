---
title: "Identity Brokering Social Login Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "External identity provider integration and social login. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# Identity Brokering Social Login Blueprint

> External identity provider integration and social login

| | |
|---|---|
| **Feature** | `identity-brokering-social-login` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | identity-brokering, social-login |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/identity-brokering-social-login.blueprint.yaml) |
| **JSON API** | [identity-brokering-social-login.json]({{ site.baseurl }}/api/blueprints/integration/identity-brokering-social-login.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `provider_alias` | text | Yes | Provider Alias | Validations: required |
| `client_id` | text | Yes | Client ID | Validations: required |

## Rules

- **core:** Identity provider delegation

## Outcomes

### User_authenticated (Priority: 5)

**Given:**
- `provider_alias` exists `null`

**Then:**
- **emit_event** event: `broker.authenticated`

**Result:** External authentication successful

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `BROKER_ERROR` | 401 | External authentication failed | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `broker.authenticated` | External authentication successful | `user_id` |

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
  "name": "Identity Brokering Social Login Blueprint",
  "description": "External identity provider integration and social login. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "identity-brokering, social-login"
}
</script>
