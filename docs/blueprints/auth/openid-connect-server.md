---
title: "Openid Connect Server Blueprint"
layout: default
parent: "Auth"
grand_parent: Blueprint Catalog
description: "OAuth 2.0 and OpenID Connect identity provider with token issuance. 3 fields. 2 outcomes. 1 error codes. rules: core"
---

# Openid Connect Server Blueprint

> OAuth 2.0 and OpenID Connect identity provider with token issuance

| | |
|---|---|
| **Feature** | `openid-connect-server` |
| **Category** | Auth |
| **Version** | 1.0.0 |
| **Tags** | oauth2, oidc |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/auth/openid-connect-server.blueprint.yaml) |
| **JSON API** | [openid-connect-server.json]({{ site.baseurl }}/api/blueprints/auth/openid-connect-server.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `client_id` | text | Yes | Client ID | Validations: required |
| `scope` | text | Yes | Scopes | Validations: required |
| `redirect_uri` | url | Yes | Redirect URI | Validations: required, url |

## Rules

- **core:** OIDC protocol compliance

## Outcomes

### Invalid_client (Priority: 1) — Error: `INVALID_CLIENT`

**Given:**
- `client_id` neq `registered`

**Then:**
- **emit_event** event: `oidc.invalid_client`

**Result:** Invalid client

### Authorization_success (Priority: 5)

**Given:**
- `client_id` exists `null`

**Then:**
- **emit_event** event: `oidc.authorized`

**Result:** Authorization code issued

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_CLIENT` | 401 | Client not found | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `oidc.authorized` | OIDC authorization success | `client_id` |
| `oidc.invalid_client` | Invalid client error | `client_id` |

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
  "name": "Openid Connect Server Blueprint",
  "description": "OAuth 2.0 and OpenID Connect identity provider with token issuance. 3 fields. 2 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "oauth2, oidc"
}
</script>
