---
title: "Integration"
layout: default
parent: Blueprint Catalog
has_children: true
nav_order: 4
description: "External service and hardware integration blueprints."
---

# Integration Blueprints

External service and hardware integration blueprints.

| Blueprint | Description | Version |
|-----------|-------------|----------|
| [Api Gateway]({{ site.baseurl }}/blueprints/integration/api-gateway/) | Route, authenticate, rate-limit, and transform API requests through a centralized gateway with versioning, circuit breaking, and CORS support | 1.0.0 |
| [Build Integration]({{ site.baseurl }}/blueprints/integration/build-integration/) | Integrate CSS framework with build tools (PostCSS, CLI, Webpack, Vite, Next.js) to process templates and generate optimized CSS | 1.0.0 |
| [Clearing House Account Management]({{ site.baseurl }}/blueprints/integration/clearing-house-account-management/) | Account management services for payment clearing houses — account mirroring, proxy management, real-time account verification, and check digit verification | 1.0.0 |
| [Clearing House Eft]({{ site.baseurl }}/blueprints/integration/clearing-house-eft/) | Electronic Funds Transfer operations via clearing house platform — inbound/outbound credits, debits, returns, on-us debits, payment cancellation, and system error correction | 1.0.0 |
| [Clearing House Inbound Payments]({{ site.baseurl }}/blueprints/integration/clearing-house-inbound-payments/) | Clearing house inbound payment processing — receiving credit transfers and direct debits from the national payment system | 1.0.0 |
| [Clearing House Outbound Payments]({{ site.baseurl }}/blueprints/integration/clearing-house-outbound-payments/) | Clearing house outbound payment operations including credit transfers, bulk payments, direct debits, returns, and cancellations | 1.0.0 |
| [Clearing House Request To Pay]({{ site.baseurl }}/blueprints/integration/clearing-house-request-to-pay/) | Request-To-Pay (RTP) and refunds for clearing house payments — outbound/inbound RTP initiation, cancellation, and refund processing | 1.0.0 |
| [Dataverse Client]({{ site.baseurl }}/blueprints/integration/dataverse-client/) | Enterprise service client for connecting to Microsoft Dataverse, managing authentication, executing CRUD operations on entities, batch processing, and discovery of available organizations | 1.0.0 |
| [Email Service]({{ site.baseurl }}/blueprints/integration/email-service/) | Send transactional and marketing emails through a provider-agnostic abstraction supporting templates, attachments, delivery tracking, and batch sends | 1.0.0 |
| [Identity Brokering Social Login]({{ site.baseurl }}/blueprints/integration/identity-brokering-social-login/) | External identity provider integration and social login | 1.0.0 |
| [Oauth Oidc Client Management]({{ site.baseurl }}/blueprints/integration/oauth-oidc-client-management/) | Client registration, configuration, and protocol mappers | 1.0.0 |
| [Oauth Provider]({{ site.baseurl }}/blueprints/integration/oauth-provider/) | OAuth 2.0 authorization server for issuing tokens to third-party applications | 1.0.0 |
| [Openclaw Message Routing]({{ site.baseurl }}/blueprints/integration/openclaw-message-routing/) | Central message router resolving inbound messages to agents via binding precedence, role-based routing, and guild/channel/peer matching | 1.0.0 |
| [Openclaw Messaging Channel]({{ site.baseurl }}/blueprints/integration/openclaw-messaging-channel/) | Platform-agnostic messaging channel integration supporting Discord, Telegram, Slack, and 85+ platforms with unified message routing and delivery | 1.0.0 |
| [Openclaw Plugin System]({{ site.baseurl }}/blueprints/integration/openclaw-plugin-system/) | Plugin registration, lifecycle management, and capability-based permissions system for extending OpenClaw functionality | 1.0.0 |
| [Palm Vein]({{ site.baseurl }}/blueprints/integration/palm-vein/) | Biometric scanning hardware integration for palm vein pattern registration, feature extraction, and 1:N template matching | 1.0.0 |
| [Payment Gateway]({{ site.baseurl }}/blueprints/integration/payment-gateway/) | Process payments through a provider-agnostic gateway abstraction supporting authorization, capture, void, refund, and webhook-driven status updates | 1.0.0 |
| [Plugin Development]({{ site.baseurl }}/blueprints/integration/plugin-development/) | Create and register plugins to extend CSS framework with custom utilities, variants, and theme values | 1.0.0 |
| [Plugin Overrides]({{ site.baseurl }}/blueprints/integration/plugin-overrides/) | Extensible plugin architecture with 12 UI override points, wrapping composition, field type customization, and sidebar panels | 1.0.0 |
| [Prisma Cli]({{ site.baseurl }}/blueprints/integration/prisma-cli/) | CLI tools for schema validation, formatting, generation, and database introspection | 1.0.0 |
| [Pub Sub Messaging]({{ site.baseurl }}/blueprints/integration/pub-sub-messaging/) | Real-time fire-and-forget message broadcasting with direct channel subscriptions and pattern-based subscriptions; sharded variant for cluster deployments | 1.0.0 |
| [Stablecoin Wallet Api]({{ site.baseurl }}/blueprints/integration/stablecoin-wallet-api/) | Stablecoin wallet infrastructure API — multi-chain wallets, addresses, deposits, withdrawals, swaps, gateway, checkout, and fiat offramp | 1.0.0 |
| [User Federation Ldap Kerberos]({{ site.baseurl }}/blueprints/integration/user-federation-ldap-kerberos/) | LDAP, Kerberos, and AD directory integration | 1.0.0 |
| [Webhook Ingestion]({{ site.baseurl }}/blueprints/integration/webhook-ingestion/) | Receive and process incoming webhooks from external services with signature verification (HMAC/RSA), replay protection, idempotent deduplication, and async handler routing | 1.0.0 |
