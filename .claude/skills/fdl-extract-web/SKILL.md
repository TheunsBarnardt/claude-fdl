---
name: fdl-extract-web
description: Crawl a documentation website and extract API operations, rules, and requirements into FDL blueprints
user_invocable: true
command: fdl-extract-web
arguments: "<url> [feature-name] [category]"
---

# FDL Extract Web — Website to Blueprint

Crawl a documentation website (API docs, integration guides, developer portals) and extract all operations, rules, fields, actors, states, and requirements into complete FDL blueprint YAML files. The user does NOT need to know YAML — use plain language throughout.

## Core Principle: Plain Language, No YAML Jargon

- NEVER show raw YAML during the conversation
- NEVER use FDL-specific terms with the user (outcomes, flows, events, etc.)
- DO use AskUserQuestion to clarify ambiguities found on the website
- DO present extracted information as plain-English bullet points
- DO generate YAML silently behind the scenes
- DO flag things the documentation doesn't make clear — ask the user rather than guessing

## Usage

```
/fdl-extract-web https://docs.example.com/api/overview payments integration
/fdl-extract-web https://developer.stripe.com/docs/payments checkout payment
/fdl-extract-web https://docs.electrumsoftware.com/epc/public/epc-overview epc-payments integration
/fdl-extract-web https://api.example.com/docs
```

## Arguments

- `<url>` — The landing/overview page URL. The skill will discover and crawl linked pages from the navigation.
- `[feature-name]` — Optional kebab-case name. If omitted, infer from the site title or ask.
- `[category]` — Optional. One of: auth, data, access, ui, integration, notification, payment, workflow. If omitted, infer or ask.

## Why Chrome MCP Tools?

Most modern documentation sites are JavaScript-rendered (React, Next.js, Docusaurus, ReadMe, Redocly, etc.). Standard HTTP fetching only returns CSS/JS scaffolding, not the actual content. This skill uses the Chrome browser MCP tools to:
- Navigate to pages and wait for JS rendering
- Read the fully-rendered page text
- Click to expand collapsed sidebar sections
- Extract navigation links via JavaScript execution
- Screenshot pages to understand layout and diagrams

## Workflow

### Step 1: Open and Map the Site

1. Connect to Chrome browser:
   ```
   mcp__Claude_in_Chrome__tabs_context_mcp (createIfEmpty: true)
   ```
2. Navigate to the provided URL:
   ```
   mcp__Claude_in_Chrome__navigate (url, tabId)
   ```
3. Wait for page to fully render (2-3 seconds):
   ```
   mcp__Claude_in_Chrome__computer (action: wait, duration: 3)
   ```
4. Take a screenshot to see the page layout and navigation structure:
   ```
   mcp__Claude_in_Chrome__computer (action: screenshot)
   ```
5. **Extract top-level navigation tabs FIRST.** Many doc sites have separate sections behind top-nav tabs (e.g., "Documentation", "API Reference", "Security", "Changelog"). These are distinct page trees with their own sidebars:
   ```javascript
   // Get top-nav / header links — these are separate doc sections
   const topNav = [];
   document.querySelectorAll('header a, [class*="topbar"] a, [class*="nav"] a').forEach(a => {
     const href = a.getAttribute('href');
     const text = a.textContent.trim();
     if (href && text && !href.startsWith('mailto:') && !href.startsWith('http'))
       topNav.push({ text, href });
   });
   JSON.stringify(topNav);
   ```
   **IMPORTANT:** Each top-nav tab may have its own sidebar with completely different pages. You must navigate to EACH tab and extract its sidebar links separately. Common tab patterns:
   - **Documentation** — guides, concepts, how-to
   - **API Reference** — endpoint specs, request/response schemas
   - **Security** — architecture, key management, compliance
   - **Changelog** — version history, breaking changes
   - **SDKs / Libraries** — language-specific integration guides

6. Extract sidebar links for the current tab:
   ```javascript
   // Expand all collapsed sidebar sections first
   document.querySelectorAll('[aria-expanded="false"]').forEach(el => el.click());

   // Second pass for nested sections
   setTimeout(() => {
     document.querySelectorAll('[aria-expanded="false"]').forEach(el => el.click());
   }, 500);

   // Collect all unique documentation links
   const seen = new Set();
   const results = [];
   document.querySelectorAll('a[href]').forEach(a => {
     const href = a.getAttribute('href');
     const text = a.textContent.trim();
     if (href && text && !seen.has(href) && !href.startsWith('#') && !href.startsWith('http')) {
       seen.add(href);
       results.push({ text, href });
     }
   });
   JSON.stringify(results);
   ```

7. **Navigate to each top-nav tab** and repeat step 6 to extract that tab's sidebar links. Build the complete page URL list grouped by tab/section.

8. Build the master crawl list. Group pages by section (from tab name + sidebar headings).

**If the sidebar has expandable sections that didn't expand via JavaScript**, click them manually:
```
mcp__Claude_in_Chrome__computer (action: left_click, coordinate: [x, y])
```
Then re-run the link extraction.

**If the site is very large (50+ pages)**, ask the user which sections are most relevant:
"This documentation has {N} pages across {M} sections. Which sections should I focus on?"

### Step 1.5: Discover API Specifications and Technical Resources

Before crawling individual pages, look for machine-readable API specs and collections that contain richer technical detail than the rendered docs pages.

#### What to look for:

1. **OpenAPI / Swagger specifications** — the most comprehensive source of endpoint details:
   ```javascript
   // Search for OpenAPI/Swagger spec URLs in the page source
   const links = [];
   document.querySelectorAll('a[href]').forEach(a => {
     const href = a.getAttribute('href') || '';
     if (href.match(/openapi|swagger|\.json$|\.yaml$|\/spec\b/i)) {
       links.push({ text: a.textContent.trim(), href });
     }
   });
   // Also check for embedded spec URLs in scripts
   const scripts = document.querySelectorAll('script');
   scripts.forEach(s => {
     const match = s.textContent.match(/(https?:\/\/[^\s"']+(?:openapi|swagger)[^\s"']*)/gi);
     if (match) links.push(...match.map(url => ({ text: 'embedded spec', href: url })));
   });
   JSON.stringify(links);
   ```
   If an OpenAPI JSON/YAML URL is found, fetch it directly with `WebFetch` — it contains every endpoint, parameter, schema, and response in machine-readable format.

2. **Postman Collections** — often linked from introduction/getting-started pages:
   ```javascript
   // Search for Postman collection links
   const postman = [];
   document.querySelectorAll('a[href]').forEach(a => {
     const href = a.getAttribute('href') || '';
     const text = a.textContent.trim().toLowerCase();
     if (href.includes('postman') || href.includes('.postman_collection') ||
         text.includes('postman') || text.includes('collection')) {
       postman.push({ text: a.textContent.trim(), href: a.getAttribute('href') });
     }
   });
   JSON.stringify(postman);
   ```
   If a Postman collection URL is found (e.g., `app.getpostman.com/run-collection/...` or a JSON link), navigate to it or fetch it — it contains example requests, headers, and test scripts.

3. **SDK / Client library repos** — GitHub links to official SDKs:
   ```javascript
   const sdks = [];
   document.querySelectorAll('a[href*="github.com"], a[href*="npmjs.com"], a[href*="pypi.org"]').forEach(a => {
     sdks.push({ text: a.textContent.trim(), href: a.getAttribute('href') });
   });
   JSON.stringify(sdks);
   ```
   Note SDK links in the blueprint's `extensions` section but don't crawl external repos.

4. **GraphQL schemas** — for GraphQL APIs:
   Look for `.graphql` files, introspection endpoints, or GraphQL playground links.

5. **Webhook payload examples** — often buried in dedicated webhook/events pages:
   These contain exact JSON structures for event payloads. Prioritize these pages during crawling.

#### What to extract from specs:

| Source | What it provides | How to use it |
|--------|-----------------|---------------|
| **OpenAPI spec** | Every endpoint, parameter, schema, response code | Primary source for fields, outcomes, errors |
| **Postman collection** | Example requests with headers, bodies, auth | Validate field names, discover undocumented params |
| **Authentication page** | Auth method, header format, token lifecycle | rules.security + extensions.api.auth |
| **Errors page** | HTTP codes, error response format, error codes | errors[] section |
| **Webhooks/Events page** | Event names, payload schemas, retry policies | events[] section + rules.webhooks |
| **Security page** | Encryption, key management, compliance certs | rules.security + extensions.security |
| **Changelog** | Breaking changes, deprecated endpoints | Flag deprecated operations in blueprint |

**Priority order:** OpenAPI spec > API Reference pages > Postman collection > Guide pages > Changelog

### Step 2: Crawl and Extract Content

For each page URL discovered in Step 1:

1. Navigate to the page:
   ```
   mcp__Claude_in_Chrome__navigate (url, tabId)
   ```
2. Wait for rendering:
   ```
   mcp__Claude_in_Chrome__computer (action: wait, duration: 2)
   ```
3. Extract the page text:
   ```
   mcp__Claude_in_Chrome__get_page_text (tabId)
   ```
4. For each page, note:
   - **Source URL** — for traceability comments in the blueprint
   - **Page title** — from the extracted text
   - **Content category** — overview, API endpoint, guide, reference, etc.

**For API reference pages** (OpenAPI/Swagger/Redoc), also look for:
- HTTP methods and paths
- Request/response schemas with field names and types
- Required vs optional fields
- Authentication headers
- Status codes and error responses
- Example payloads

**If a page has scrollable content that gets cut off**, scroll down and extract more:
```
mcp__Claude_in_Chrome__computer (action: scroll, coordinate: [center_x, center_y], scroll_direction: down)
mcp__Claude_in_Chrome__get_page_text (tabId)
```

**For OpenAPI/Redoc pages that render API operations**, use JavaScript to extract structured data:
```javascript
// Example: extract all API operation summaries from a Redoc page
document.querySelectorAll('[class*="operation"]').forEach(op => {
  // Extract method, path, summary, parameters
});
```

### Step 3: Analyze and Categorize

Systematically scan ALL extracted page content for each FDL construct. For each item found, note the source URL so the user can trace back.

#### Extract these elements:

| FDL Construct | What to look for on the website |
|---------------|--------------------------------|
| **Fields** | API request/response fields, form inputs, data model attributes, schema properties, query parameters, headers |
| **Rules** | "Must", "shall", "required", constraints, rate limits, size limits, validation rules, business rules, compliance requirements, "before you can...", prerequisites |
| **Outcomes** | API success/error responses, "when X then Y", expected results, postconditions, "the system will...", "you will receive..." |
| **Flows** | Step-by-step integration procedures, "first... then...", numbered implementation steps, sequence diagrams described in text, transaction flows |
| **Actors** | System names (API, gateway, bank, processor), user roles, external parties, services that send/receive |
| **States** | Transaction statuses, lifecycle stages, "pending", "completed", "failed", state transition tables, status codes with meanings |
| **SLAs** | Timeout durations, processing times, "within X seconds", retry intervals, availability guarantees |
| **Errors** | HTTP status codes with descriptions, error response schemas, failure scenarios, "if X fails then..." |
| **Events** | Webhooks, callbacks, notifications, "when X happens notify Y", asynchronous responses, event payloads |
| **Validation** | Field format rules, length limits, required fields, regex patterns, "must be a valid...", CDV checks, format constraints |
| **Security** | Authentication methods (JWT, OAuth, API keys), message signing, encryption, TLS requirements, key rotation |
| **Relationships** | References to other APIs/services, dependencies, "requires X to be configured first", linked documentation |
| **API Operations** | HTTP method + path + description → these become outcomes with call_service actions |

#### Extraction rules:

- **Be comprehensive** — extract from EVERY page crawled, not just the overview
- **Preserve the documentation's language** — use exact thresholds, limits, and terminology
- **Flag ambiguity** — if a requirement is vague, add it to the ambiguous items list
- **Map API operations to outcomes** — each API endpoint becomes an outcome with given (preconditions), then (the API call + side effects), and result (the response)
- **Capture both directions** — inbound API calls (webhooks the system sends TO you) AND outbound API calls (requests you send TO the system)

### Step 4: Present Extraction Summary

Before generating, show the user what was found **in plain language** (no YAML jargon):

```
Here's what I found across {N} pages at {domain}:

PAGES CRAWLED:
  {list of page titles with URLs}

API OPERATIONS FOUND:
  → Inbound (calls you receive):
    - Payment notification (POST) — notifies you when a payment completes
    - Proxy resolution (POST) — asks you to resolve a customer proxy
    - Payment authorisation (POST) — asks you to authorise a payment
  → Outbound (calls you make):
    - Send payment (POST) — initiate an outbound payment
    - Request-to-pay (POST) — send a payment request to a customer
    - Scheme inquiry (GET) — check which banks support PayShap

DATA THE FEATURE NEEDS:
  12 fields — amount, currency, account_number, proxy_id, ...

WHAT SHOULD HAPPEN:
  ✓ Payment sent → notification received with outcome
  ✓ Proxy lookup → customer record returned
  ✓ RTP sent → status updates through lifecycle
  ✗ Payment failed → error notification with reason code

WHO'S INVOLVED:
  4 actors — Corporate Client, Electrum (integration layer), Sponsor Bank, BankservAfrica

LIFECYCLE:
  initiated → processing → completed (+ failed/expired branches)

RULES & CONSTRAINTS:
  - JWT message security required on all messages
  - CDV validation on account numbers
  - Merchant account must be pre-funded for outbound payments
  - Domain registration required for PayShap

⚠ THINGS THE DOCUMENTATION DOESN'T MAKE CLEAR:
  - Exact retry policy for failed webhook deliveries
  - Maximum payload size for bulk payment submissions
```

**Use AskUserQuestion** to clarify:
1. Ambiguous items found in the documentation
2. Whether to create one combined blueprint or separate blueprints per feature area (if the site covers multiple distinct features)
3. Which category best fits (if not provided as argument)

Wait for user confirmation before proceeding.

### Step 5: Check Existing Blueprints

1. Glob for `blueprints/**/*.blueprint.yaml`
2. Parse all existing blueprints
3. Check if this feature name already exists (warn if so — offer to merge or create new)
4. Identify relationships:
   - Does any existing blueprint reference this feature?
   - Should this blueprint reference existing ones?
5. Show the dependency graph

### Step 6: Generate the Blueprint(s)

Generate complete `.blueprint.yaml` file(s) following the FDL meta-schema.

#### Single vs Multiple Blueprints

If the documentation covers multiple distinct feature areas (e.g., receive-payments, send-payments, request-payments), ask the user:
- **Combined:** One blueprint with all operations as outcomes
- **Separate:** Multiple blueprints, one per feature area, with `related` cross-references

#### Blueprint Template

```yaml
# ============================================================
# {FEATURE_NAME} — Feature Blueprint
# FDL v0.1.0 | Blueprint v1.0.0
# ============================================================
# Extracted from: {base URL}
# Pages crawled: {count}
# {Brief description}
# ============================================================

feature: {feature-name}
version: "1.0.0"
description: {one-line description}
category: {category}
tags: [{relevant, tags}]

actors:
  # Systems, services, and roles identified in the docs

fields:
  # API request/response fields with types and validation
  # Include source URL as YAML comments

states:
  # Transaction/payment lifecycle states from the docs

rules:
  # Business rules, security requirements, constraints
  # Source: {page URL} — "{quoted requirement}"

sla:
  # Processing times, timeouts, retry policies

outcomes:
  # API operations mapped to given/then/result format
  # Inbound operations (webhooks/callbacks you receive)
  # Outbound operations (API calls you make)
  # Error scenarios

flows:
  # Step-by-step integration procedures from implementation guides
  # Include actor on each step

errors:
  # HTTP status codes and error responses from the API

events:
  # Webhooks, notifications, async callbacks

related:
  # Connections to existing blueprints

extensions:
  # API-specific details: base URL, auth method, content type
  api:
    base_url: "{from docs}"
    auth: "{JWT, OAuth, API key, etc.}"
    content_type: "application/json"
```

#### Source traceability

Add YAML comments that reference the source page:

```yaml
rules:
  message_security:
    jwt_required: true
    # Source: https://docs.example.com/technical-requirements
    # "Transaction message transmission will make use of JSON web tokens (JWTs)"
```

#### Mapping API operations to outcomes

Each API operation becomes an outcome:

```yaml
outcomes:
  payment_notification_received:
    priority: 1
    given:
      - "Inbound payment has been processed by the bank"
      - "Payment was directed to client's merchant account"
    then:
      - action: call_service
        target: "webhook.payment_notification"
        description: "Electrum sends payment notification to client system"
      - action: emit_event
        event: payment.notification.received
        payload: [transaction_id, amount, status, account_number]
    result: "Client receives notification and updates customer record"
    # Source: https://docs.example.com/receive-payments

  send_payment_success:
    priority: 5
    given:
      - "Client is authenticated"
      - "Merchant account has sufficient funds"
      - "Destination account passes CDV validation"
    then:
      - action: call_service
        target: "epc_api.send_payment"
        description: "Client sends outbound payment request to Electrum"
      - action: emit_event
        event: payment.outbound.initiated
        payload: [transaction_id, amount, destination_account]
    result: "Payment is queued for processing"
    # Source: https://docs.example.com/send-payments
```

### Step 7: Validate and Summarize

1. Write the file(s) to `blueprints/{category}/{feature}.blueprint.yaml`
2. Run `node scripts/validate.js blueprints/{category}/{feature}.blueprint.yaml`
3. If validation fails, fix the issues and re-validate
4. If cross-reference warnings appear, note them in the output

Output a clean summary:

```
Created: blueprints/integration/epc-payments.blueprint.yaml
Source:  https://docs.electrumsoftware.com/epc/public/epc-overview (12 pages crawled)

Feature: epc-payments v1.0.0
Actors:  4 (corporate_client, electrum, sponsor_bank, bankservafrica)
Fields:  15 (amount, currency, account_number, proxy_id, ...)
States:  6 (initiated → processing → completed, + failed/expired)
Outcomes: 12 (6 inbound operations, 6 outbound operations)
Errors:  8
Events:  6

Validation: PASS

Pages crawled:
  ✓ EPC Overview — https://docs.example.com/epc-overview
  ✓ Receive Payments — https://docs.example.com/receive-payments
  ✓ Send Payments — https://docs.example.com/send-payments
  ...

⚠ Items that could not be mapped:
  - Reconciliation file format — too complex for FDL fields, needs separate spec
  - Batch posting configuration — requires bank-specific setup

💡 Suggested next steps:
  - Create blueprints for sub-features: payshap-proxy, rtp-lifecycle
  - Run /fdl-generate epc-payments express to generate integration code
```

## Handling Edge Cases

### Site requires authentication
If the docs site requires login:
1. Ask the user to log in manually in Chrome
2. Then navigate using the authenticated session
3. Note: Never enter credentials on the user's behalf

### Site has too many pages (50+)
1. List all sections/page counts
2. Ask the user which sections to focus on
3. Crawl only the selected sections

### Site has OpenAPI/Swagger specs
If the docs include embedded OpenAPI viewers (Redoc, Swagger UI):
1. Search page source for the spec URL (look for `.json`, `.yaml`, `openapi`, `swagger` in `<script>` tags and link elements)
2. If a raw spec URL is found, fetch it with `WebFetch` — this is the **highest-value source** since it contains every endpoint, schema, and response in machine-readable format
3. If only a rendered viewer is available, extract from the rendered page using `get_page_text` and JavaScript DOM queries
4. Spec data takes priority over rendered docs when there are discrepancies

### Site has Postman collections
If the docs link to a Postman collection:
1. Look for "Run in Postman" buttons, `app.getpostman.com` links, or downloadable `.postman_collection.json` files
2. If a direct JSON URL is available, fetch it — collections contain example requests, headers, auth config, and test scripts
3. Cross-reference Postman examples with the API Reference pages to validate field names and discover undocumented parameters
4. Note the Postman collection URL in `extensions.api.postman_collection`

### Site has SDK / client library links
If the docs reference official SDKs (GitHub repos, npm packages, PyPI packages):
1. Note the SDK links in `extensions.api.sdks` but do NOT crawl external repositories
2. SDK READMEs can contain usage examples that clarify ambiguous API docs — if a specific question arises, you may fetch a single README

### API documentation across multiple base URLs or top-nav tabs
Documentation sites commonly split content across separate top-nav tabs, each with its own sidebar and page tree:
1. **Always check all top-nav tabs** — not just the one the user linked to
2. Common critical tabs that MUST be crawled:
   - **API Reference** — endpoint specs, request/response schemas (often the most technical)
   - **Security** — auth details, encryption, key management, compliance
   - **Guides** — integration flows, prerequisites, step-by-step procedures
3. If tabs link to different subdomains or base paths (e.g., `/openapi/...` vs `/docs/...`), follow all links within the same domain
4. Note different base URLs in `extensions.api` section

### Site content is paginated or tabbed
If page content is hidden behind tabs or pagination:
1. Click each tab/pagination control
2. Extract text after each click
3. Combine all content for that page
4. Common tab patterns: code examples in multiple languages (cURL, JavaScript, PHP), request/response tabs

### Diagrams and flowcharts
If pages contain visual diagrams:
1. Screenshot them for reference
2. Extract any text descriptions near the diagram
3. Note in the blueprint: "See {URL} for transaction flow diagram"

## Extraction Quality Checklist

### Accuracy
- [ ] Every extracted rule references its source URL
- [ ] Thresholds and limits match the documentation exactly
- [ ] Field names are derived from the API's terminology
- [ ] No requirements were invented — only what the docs state

### Completeness
- [ ] ALL top-nav tabs were discovered and their sidebars crawled (not just the landing tab)
- [ ] API Reference section was crawled (authentication, errors, and endpoint pages)
- [ ] Security section was crawled (architecture, key management, compliance)
- [ ] OpenAPI specs / Postman collections were searched for and fetched if available
- [ ] All crawled pages were analyzed
- [ ] Both inbound AND outbound API operations were captured
- [ ] Success AND error scenarios were captured
- [ ] Authentication and security requirements were captured
- [ ] Webhook event types and payload structures were captured
- [ ] Ambiguous items were flagged, not silently dropped

### FDL Compliance
- [ ] Feature name: kebab-case
- [ ] Field names: snake_case
- [ ] Error codes: UPPER_SNAKE_CASE
- [ ] Event names: dot.notation
- [ ] Actor IDs: snake_case
- [ ] All required top-level fields present
- [ ] Comments explain WHY, referencing the source URL
