---
title: "Multi Factor Authentication Blueprint"
layout: default
parent: "Auth"
grand_parent: Blueprint Catalog
description: "MFA with OTP, WebAuthn, and recovery codes. 2 fields. 1 outcomes. 1 error codes. rules: core"
---

# Multi Factor Authentication Blueprint

> MFA with OTP, WebAuthn, and recovery codes

| | |
|---|---|
| **Feature** | `multi-factor-authentication` |
| **Category** | Auth |
| **Version** | 1.0.0 |
| **Tags** | mfa, credentials |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/auth/multi-factor-authentication.blueprint.yaml) |
| **JSON API** | [multi-factor-authentication.json]({{ site.baseurl }}/api/blueprints/auth/multi-factor-authentication.json) |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `credential_type` | select | Yes | Credential Type | Validations: required |
| `otp_code` | text | No | OTP Code | Validations: pattern |

## Rules

- **core:** MFA credential management

## Outcomes

### Mfa_verified (Priority: 5)

**Given:**
- `otp_code` exists `null`

**Then:**
- **emit_event** event: `mfa.verified`

**Result:** MFA verified

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `INVALID_OTP` | 401 | Invalid OTP code | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `mfa.verified` | MFA verification successful | `user_id` |

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
  "name": "Multi Factor Authentication Blueprint",
  "description": "MFA with OTP, WebAuthn, and recovery codes. 2 fields. 1 outcomes. 1 error codes. rules: core",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "mfa, credentials"
}
</script>
