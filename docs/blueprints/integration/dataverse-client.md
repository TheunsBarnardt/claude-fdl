---
title: "Dataverse Client Blueprint"
layout: default
parent: "Integration"
grand_parent: Blueprint Catalog
description: "Enterprise service client for connecting to Microsoft Dataverse, managing authentication, executing CRUD operations on entities, batch processing, and discovery"
---

# Dataverse Client Blueprint

> Enterprise service client for connecting to Microsoft Dataverse, managing authentication, executing CRUD operations on entities, batch processing, and discovery of available organizations

| | |
|---|---|
| **Feature** | `dataverse-client` |
| **Category** | Integration |
| **Version** | 1.0.0 |
| **Tags** | crm, cloud, dataverse, enterprise, entity-management, async-first, sdk |
| **YAML Source** | [View on GitHub](https://github.com/TheunsBarnardt/claude-fdl/blob/master/blueprints/integration/dataverse-client.blueprint.yaml) |
| **JSON API** | [dataverse-client.json]({{ site.baseurl }}/api/blueprints/integration/dataverse-client.json) |

## Actors

| ID | Name | Type | Description |
|----|------|------|-------------|
| `client_application` | Client Application | system | The consuming .NET application that needs to interact with Dataverse |
| `dataverse_service` | Dataverse Service | external | Microsoft Dataverse cloud service providing entity storage, querying, and operations |
| `authentication_service` | Authentication Service | external | Azure AD / MSAL for token generation and management (OAuth, Client Secret, Certificate) |
| `discovery_service` | Discovery Service | external | Dataverse organization discovery endpoint for listing available instances |

## Fields

| Name | Type | Required | Label | Description |
|------|------|----------|-------|-------------|
| `service_uri` | url | Yes | Dataverse Instance URL |  |
| `authentication_type` | select | Yes | Authentication Type |  |
| `username` | email | No | Username |  |
| `password` | password | No | Password |  |
| `client_id` | text | Yes | Client / Application ID |  |
| `client_secret` | password | No | Client Secret |  |
| `redirect_uri` | url | No | Redirect URI |  |
| `prompt_behavior` | select | No | Login Prompt |  |
| `certificate_thumbprint` | text | No | Certificate Thumbprint |  |
| `certificate_store_name` | select | No | Certificate Store |  |
| `token_cache_path` | text | No | Token Cache Path |  |
| `access_token_provider` | text | No | Token Provider Function |  |
| `custom_headers_provider` | text | No | Custom Headers Function |  |
| `domain` | text | No | Windows Domain |  |
| `home_realm_uri` | url | No | Home Realm URI |  |
| `use_current_user` | boolean | No | Use Current Windows User |  |
| `skip_discovery` | boolean | No | Skip Organization Discovery |  |
| `require_unique_instance` | boolean | No | Require Unique Instance |  |
| `batch_id` | text | No | Batch ID |  |
| `batch_return_results` | boolean | No | Batch Return Results |  |
| `batch_continue_on_error` | boolean | No | Batch Continue on Error |  |
| `entity_name` | text | No | Entity Name |  |
| `record_id` | text | No | Record ID (GUID) |  |
| `columns_to_retrieve` | text | No | Columns to Retrieve |  |
| `filter_criteria` | text | No | Filter Criteria |  |
| `sort_order` | text | No | Sort Order |  |
| `page_size` | number | No | Page Size |  |
| `relationship_name` | text | No | Relationship Name |  |
| `related_entity_ids` | text | No | Related Entity IDs |  |
| `request_body` | json | No | Request Body |  |
| `response_body` | json | No | Response Body |  |
| `http_method` | select | No | HTTP Method |  |
| `query_string` | text | No | Query String |  |
| `custom_headers` | json | No | Custom Headers |  |
| `enable_logging` | boolean | No | Enable Logging |  |
| `log_file_path` | text | No | Log File Path |  |
| `in_memory_logging` | boolean | No | In-Memory Logging |  |
| `log_retention_minutes` | number | No | Log Retention (Minutes) |  |
| `msal_log_pii` | boolean | No | Log PII in MSAL |  |

## States

**State field:** `undefined`

## Rules

- **security:**
  - **authentication:** OAuth is the recommended authentication type for cloud (Dataverse online) scenarios, Client Secret and Certificate auth are suitable for service-to-service scenarios, Interactive username/password auth is supported for user-interactive applications, Active Directory auth is limited to on-premises Dataverse deployments, Token cache must be stored securely (file permissions: 0600 / owner-only access), Client secrets must never be hardcoded; use environment variables or secure vaults, Certificate-based auth requires the certificate private key to be available locally
  - **rate_limiting:** Dataverse enforces API throttling (429 Too Many Requests) when request volume exceeds service limits, Default retry logic includes exponential backoff for concurrency throttling, Affinity cookie (enabled by default) improves throttling by routing requests to consistent node, Disable affinity cookie only when required by load balancing scenarios
  - **input_validation:** Entity names must be valid logical names (checked against metadata), Record IDs must be valid GUIDs (validated at SDK level), Column names must exist in entity schema or 'all' wildcard can be used, Relationship names must exist in organization metadata, Filter criteria must be valid OData or FetchXml syntax
- **reliability:**
  - **retry_behavior:** Default max retry count: 10 (configurable), Default retry delay: 5 seconds between attempts (configurable), Exponential backoff can be enabled for throttling scenarios, Retries occur automatically for transient failures (network timeouts, service throttling), Non-transient errors (invalid credentials, record not found) do not retry
  - **batch_constraints:** Maximum 5,000 requests per batch, Maximum 50,000 concurrent batches, Single batch request limit: 10 MB payload, Batch response includes individual request results; failures do not rollback entire batch unless transaction: true, Continue-on-error flag allows batch to proceed if individual requests fail
  - **connection_pooling:** By default, service clients are pooled and reused within the same process, Setting require_unique_instance: true creates a new client instance (useful for multi-user scenarios), Each connection maintains its own authentication state and caching
- **observability:**
  - **logging:** TraceLogger captures all SDK operations (connection, auth, API calls, errors), In-memory log collection must be explicitly enabled (can impact memory), Log files are rotated based on size and retention policy, PII logging is disabled by default (enable only in development)

## SLA

| Scope | Max Duration | Escalation |
|-------|-------------|------------|
| connection_timeout | 30 seconds |  |
| msal_token_timeout | 30 seconds |  |
| msal_retries |  |  |
| api_operation_retries |  |  |
| log_retention | 5 minutes |  |

## Outcomes

### Establish_connection (Priority: 1)

**Given:**
- `service_uri` (input) exists
- `authentication_type` (input) exists
- `client_id` (input) exists

**Then:**
- **transition_state** field: `connection_state` from: `disconnected` to: `authenticated`
- **emit_event** event: `connection.established`

**Result:** Service client connected and authenticated to Dataverse

### Connection_failed (Priority: 2) — Error: `CONNECTION_FAILED`

**Given:**
- `connection_state` (db) eq `connection_failed`

**Result:** Connection attempt failed due to invalid credentials or network issue

### Discover_organizations (Priority: 3)

**Given:**
- `authentication_type` (input) exists
- `client_id` (input) exists

**Then:**
- **emit_event** event: `discovery.completed`

**Result:** List of available Dataverse organizations returned with metadata

### Create_record (Priority: 10)

**Given:**
- `connection_state` (db) eq `authenticated`
- `entity_name` (input) exists

**Then:**
- **create_record** target: `entity_record`
- **emit_event** event: `record.created`

**Result:** New record created; record ID returned

### Retrieve_record (Priority: 11)

**Given:**
- `connection_state` (db) eq `authenticated`
- `entity_name` (input) exists
- `record_id` (input) exists

**Then:**
- **emit_event** event: `record.retrieved`

**Result:** Entity record returned with specified columns

### Query_records (Priority: 12)

**Given:**
- `connection_state` (db) eq `authenticated`
- `entity_name` (input) exists

**Then:**
- **emit_event** event: `records.queried`

**Result:** Entity collection returned with matching records

### Update_record (Priority: 13)

**Given:**
- `connection_state` (db) eq `authenticated`
- `record_id` (input) exists

**Then:**
- **emit_event** event: `record.updated`

**Result:** Record updated successfully

### Delete_record (Priority: 14)

**Given:**
- `connection_state` (db) eq `authenticated`
- `record_id` (input) exists

**Then:**
- **delete_record** target: `entity_record`
- **emit_event** event: `record.deleted`

**Result:** Record deleted successfully

### Record_not_found (Priority: 15) — Error: `RECORD_NOT_FOUND`

**Given:**
- `record_id` (input) exists

**Result:** Record with specified ID not found

### Insufficient_permissions (Priority: 16) — Error: `INSUFFICIENT_PERMISSIONS`

**Result:** Operation denied due to insufficient permissions

### Associate_entities (Priority: 20)

**Given:**
- `connection_state` (db) eq `authenticated`
- `relationship_name` (input) exists
- `record_id` (input) exists

**Then:**
- **emit_event** event: `entities.associated`

**Result:** Entities associated successfully via relationship

### Disassociate_entities (Priority: 21)

**Given:**
- `connection_state` (db) eq `authenticated`
- `relationship_name` (input) exists

**Then:**
- **emit_event** event: `entities.disassociated`

**Result:** Association removed successfully

### Relationship_not_found (Priority: 22) — Error: `RELATIONSHIP_NOT_FOUND`

**Given:**
- `relationship_name` (input) exists

**Result:** Relationship not found in organization metadata

### Execute_batch (Priority: 30)

**Given:**
- `connection_state` (db) eq `authenticated`
- `batch_id` (input) exists

**Then:**
- **emit_event** event: `batch.execution.completed`

**Result:** Batch results returned with individual request status

### Batch_limit_exceeded (Priority: 31) — Error: `BATCH_LIMIT_EXCEEDED`

**Given:**
- `batch_id` (input) exists

**Result:** Batch size exceeds maximum (5000 requests per batch)

### Execute_organization_request (Priority: 40)

**Given:**
- `connection_state` (db) eq `authenticated`

**Then:**
- **emit_event** event: `organization.request.executed`

**Result:** Organization request executed and response returned

### Execute_web_request (Priority: 50)

**Given:**
- `connection_state` (db) eq `authenticated`
- `http_method` (input) exists
- `query_string` (input) exists

**Then:**
- **emit_event** event: `web.request.executed`

**Result:** HTTP response returned from Web API

### Rate_limited (Priority: 51) — Error: `RATE_LIMITED`

**Given:**
- Dataverse throttling limit exceeded

**Then:**
- **emit_event** event: `throttling.detected`

**Result:** Request failed with 429 Too Many Requests

### Retrieve_connection_metadata (Priority: 60)

**Given:**
- `connection_state` (db) eq `authenticated`

**Result:** Organization metadata returned (name, ID, version)

### Clone_connection (Priority: 61)

**Given:**
- `connection_state` (db) eq `authenticated`

**Then:**
- **create_record** target: `service_client_instance`

**Result:** New service client instance created with same configuration

### Dispose_connection (Priority: 62)

**Given:**
- `connection_state` (db) eq `authenticated`

**Then:**
- **transition_state** field: `connection_state` from: `authenticated` to: `disposed`

**Result:** Service client disposed and resources released

## Errors

| Code | Status | Message | Retry |
|------|--------|---------|-------|
| `CONNECTION_FAILED` | 500 | Failed to establish connection to Dataverse. Check service URI, credentials, and network connectivity. | No |
| `AUTHENTICATION_FAILED` | 401 | Authentication failed. Verify credentials, client ID, client secret, or certificate. | No |
| `INVALID_CREDENTIALS` | 401 | Provided credentials are invalid or expired. | No |
| `RATE_LIMITED` | 429 | Dataverse service throttling limit exceeded. Retry after specified delay. | No |
| `RECORD_NOT_FOUND` | 404 | Entity record with specified ID not found. | No |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions for this operation. | No |
| `INVALID_ENTITY_NAME` | 400 | Specified entity name is not valid or does not exist in organization. | No |
| `INVALID_COLUMN_NAME` | 400 | Specified column/attribute name does not exist in entity schema. | No |
| `INVALID_QUERY` | 400 | Query criteria is malformed or invalid OData/FetchXml syntax. | No |
| `RELATIONSHIP_NOT_FOUND` | 404 | Specified relationship does not exist in organization metadata. | No |
| `BATCH_PARTIAL_FAILURE` | 400 | One or more requests in batch failed while continue-on-error was false. | No |
| `BATCH_LIMIT_EXCEEDED` | 400 | Batch size exceeds 5000 requests or concurrent batch limit exceeded. | No |
| `ORGANIZATION_REQUEST_FAILED` | 400 | Organization request is invalid or not supported. | No |
| `DISCOVERY_FAILED` | 500 | Organization discovery failed. Verify discovery service endpoint and credentials. | No |
| `NETWORK_TIMEOUT` | 500 | Network timeout while communicating with Dataverse. Check connectivity. | No |
| `INVALID_TOKEN` | 401 | Provided access token is invalid or expired. | No |
| `MSAL_TIMEOUT` | 500 | Azure AD token acquisition timed out after 30 seconds. | No |
| `CERTIFICATE_NOT_FOUND` | 400 | Certificate with specified thumbprint not found in Windows certificate store. | No |

## Events

| Event | Description | Payload |
|-------|-------------|----------|
| `connection.initiated` | Service client initialization started | `service_uri`, `authentication_type` |
| `connection.established` | Successfully connected and authenticated to Dataverse | `service_uri`, `organization_id`, `organization_name` |
| `connection.failed` | Connection attempt failed | `error_code`, `error_message` |
| `connection.disposed` | Service client connection closed and resources released | `timestamp` |
| `discovery.started` | Organization discovery operation initiated | `discovery_uri` |
| `discovery.completed` | Organization discovery completed | `organization_count` |
| `record.created` | Entity record successfully created | `entity_name`, `record_id`, `created_timestamp` |
| `record.retrieved` | Entity record successfully retrieved | `entity_name`, `record_id`, `column_count` |
| `records.queried` | Multiple records retrieved via query | `entity_name`, `filter_criteria`, `result_count`, `page_size` |
| `record.updated` | Entity record successfully updated | `entity_name`, `record_id`, `updated_fields` |
| `record.deleted` | Entity record successfully deleted | `entity_name`, `record_id` |
| `entities.associated` | Two entities associated via relationship | `relationship_name`, `entity_id`, `related_entity_count` |
| `entities.disassociated` | Association between entities removed | `relationship_name`, `entity_id` |
| `batch.created` | Batch operation created and ready for requests | `batch_id`, `batch_name` |
| `batch.execution.started` | Batch execution initiated | `batch_id`, `request_count` |
| `batch.execution.completed` | Batch execution finished | `batch_id`, `successful_count`, `failed_count` |
| `organization.request.executed` | Organization-level request executed | `request_type`, `request_status` |
| `web.request.executed` | Raw HTTP request to Web API executed | `http_method`, `endpoint`, `http_status` |
| `throttling.detected` | Dataverse throttling limit detected | `retry_after_seconds`, `current_request_rate` |
| `authentication.token.refreshed` | OAuth access token refreshed | `token_expiry` |
| `logging.enabled` | Trace logging started | `log_file_path` |

## Related Blueprints

| Feature | Relationship | Reason |
|---------|-------------|--------|
| api-query-builder | recommended | Build OData and FetchXml queries for complex filtering |
| data-migration-tools | optional | Export/import entity data using Service Client |
| plugin-development | optional | Service Client used in Dataverse plugins and custom workflows |
| webhook-integration | optional | Receive Dataverse events and respond via Service Client |

<details>
<summary><strong>Extensions (framework-specific hints)</strong></summary>

```yaml
tech_stack:
  language: C#
  frameworks:
    - .NET Framework 4.6.2, 4.7.2, 4.8
    - .NET Core 3.0, 3.1
    - .NET 5.0, 6.0
  api_protocol: SOAP + REST (Dataverse Web API)
  authentication: Azure AD (MSAL), certificates, basic auth
  orm: None (SDK wraps raw entity/message objects)
  underlying_sdk: Microsoft.Xrm.Sdk, Microsoft.Xrm.Sdk.Discovery
  async_support: Full async/await with CancellationToken
nuget_packages:
  - Microsoft.PowerPlatform.Dataverse.Client (current)
  - Microsoft.PowerPlatform.Dataverse.Client.Dynamics (deprecated)
  - Microsoft.Xrm.Sdk (underlying)
  - Microsoft.Xrm.Sdk.Discovery (organization discovery)
deployment_targets:
  - ASP.NET Core web applications
  - Azure Functions (serverless)
  - Azure App Services
  - Console applications
  - Windows Services
  - WPF/WinForms desktop applications
  - Linux containers (with .NET 5+ and limitations on interactive auth)
```

</details>


<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Dataverse Client Blueprint",
  "description": "Enterprise service client for connecting to Microsoft Dataverse, managing authentication, executing CRUD operations on entities, batch processing, and discovery",
  "programmingLanguage": "YAML",
  "codeRepository": "https://github.com/TheunsBarnardt/claude-fdl",
  "license": "https://opensource.org/licenses/MIT",
  "keywords": "crm, cloud, dataverse, enterprise, entity-management, async-first, sdk"
}
</script>
