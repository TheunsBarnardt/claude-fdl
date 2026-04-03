---
title: "Oauth Oidc Client Management Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "Client registration, configuration, and protocol mappers. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# Oauth Oidc Client Management Blueprint

> Client registration, configuration, and protocol mappers

| | |
|---|---|
| **Feature** | `oauth-oidc-client-management` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | oauth2, oidc, client-registration |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/oauth-oidc-client-management.blueprint.yaml) |
| **JSON API** | [oauth-oidc-client-management.json]({{ site.baseurl }}/api/blueprints/integration/oauth-oidc-client-management.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `client_id` | text | Yes | Client ID | Validations: required, minLength |
| `redirect_uris` | text | Yes | Redirect URIs | Validations: required |

## Rules

- **core:** OAuth2/OIDC client management

## Outcomes

### Client_registered (Priority: 5)

**Given:**
- `client_id` exists `null`

**Then:**
- **emit_event** event: `client.registered`

**Result:** Client registered

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_CLIENT` | 400 | Invalid client configuration | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `client.registered` | Client registered | `client_id` |

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
  "name": "Oauth Oidc Client Management Blueprint",
  "description": "Client registration, configuration, and protocol mappers. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "oauth2, oidc, client-registration"
}
</script>
