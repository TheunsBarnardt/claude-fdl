---
title: "User Federation Ldap Kerberos Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "LDAP, Kerberos, and AD directory integration. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# User Federation Ldap Kerberos Blueprint

> LDAP, Kerberos, and AD directory integration

| | |
|---|---|
| **Feature** | `user-federation-ldap-kerberos` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | federation, ldap |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/user-federation-ldap-kerberos.blueprint.yaml) |
| **JSON API** | [user-federation-ldap-kerberos.json]({{ site.baseurl }}/api/blueprints/integration/user-federation-ldap-kerberos.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `connection_url` | url | Yes | LDAP URL | Validations: required, url |
| `bind_dn` | text | Yes | Bind DN | Validations: required |

## Rules

- **core:** Directory synchronization

## Outcomes

### User_found (Priority: 5)

**Given:**
- `connection_url` exists `null`

**Then:**
- **emit_event** event: `federation.user_found`

**Result:** User found in directory

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `FEDERATION_ERROR` | 503 | Federation service unavailable | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `federation.user_found` | User found in directory | `username` |

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
  "name": "User Federation Ldap Kerberos Blueprint",
  "description": "LDAP, Kerberos, and AD directory integration. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "federation, ldap"
}
</script>
